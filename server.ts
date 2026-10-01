import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { GoogleGenAI, Type } from '@google/genai';
import {
  createUser, getUserByEmail, getUserByToken, createSession, deleteSession, sanitizeUser, updateUser,
  findOrCreateOAuthUser, setPasswordResetCode, resetPasswordWithCode,
  createFacultyInvitation, getFacultyInvitation, markFacultyInvitationAccepted, createFacultyUser,
  createFacultyProfile, getPendingFacultyProfiles, getFacultyProfile, setFacultyApproval,
} from './server/db';

dotenv.config();

const app = express();
const PORT = 3000;
const AI_MODEL = 'gemini-3.6-flash';
app.use(express.json());

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

function getAppBaseUrl(req: express.Request): string { return process.env.APP_URL || `http://${req.headers.host || 'localhost:3000'}`; }
function getMailTransporter() {
  const emailUser = process.env.EMAIL_USER; const emailPass = process.env.EMAIL_APP_PASSWORD;
  if (!emailUser || !emailPass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user: emailUser, pass: emailPass } });
}
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated.' });
  const user = getUserByToken(authHeader.substring(7));
  if (!user) return res.status(401).json({ error: 'Session expired or invalid.' });
  if (user.accountStatus === 'suspended') return res.status(403).json({ error: 'This account has been suspended.' });
  (req as any).authUser = user; next();
}
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if ((req as any).authUser?.role !== 'admin') return res.status(403).json({ error: 'Admin access is required.' });
  next();
}
function friendlyAiError(err: any): string {
  const rawMessage: string = err?.message || '';
  if (rawMessage.includes('API key not valid') || rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('403')) return 'The AI service is not configured correctly on this server (invalid API key). Please let the site admin know.';
  if (rawMessage.includes('429') || rawMessage.toLowerCase().includes('quota') || rawMessage.toLowerCase().includes('rate limit')) return 'The AI service is getting a lot of requests right now (or the account is out of quota). Please try again shortly.';
  if (rawMessage.includes('503') || rawMessage.toLowerCase().includes('unavailable') || rawMessage.toLowerCase().includes('overloaded') || rawMessage.toLowerCase().includes('high demand')) return "Google's AI model is temporarily overloaded from high demand right now. This usually clears up within a minute or two, please try again shortly.";
  if (rawMessage.includes('500') || rawMessage.toLowerCase().includes('internal error')) return 'The AI service hit an internal error on its end. Please try again in a moment.';
  if (!rawMessage || rawMessage.trim().startsWith('{') || rawMessage.trim().startsWith('[')) return 'Something went wrong reaching the AI service. Please try again in a moment.';
  return rawMessage;
}
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY; return apiKey ? new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } }) : null;
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Only PDF files are supported.')) });
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const ROADMAP_JSON_SCHEMA = { type: Type.OBJECT, properties: { roadmapTitle: { type: Type.STRING }, overview: { type: Type.STRING }, targetRole: { type: Type.STRING }, estimatedWeeksTotal: { type: Type.INTEGER }, recommendedPrerequisites: { type: Type.ARRAY, items: { type: Type.STRING } }, levels: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { levelNumber: { type: Type.INTEGER }, title: { type: Type.STRING }, description: { type: Type.STRING }, estimatedWeeks: { type: Type.INTEGER }, topics: { type: Type.ARRAY, items: { type: Type.STRING } }, capstoneProject: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, keySkills: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['title','description','keySkills'] }, learningResources: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, type: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['title','type','description'] } } }, required: ['levelNumber','title','description','estimatedWeeks','topics','capstoneProject','learningResources'] } } }, required: ['roadmapTitle','overview','targetRole','estimatedWeeksTotal','levels'] };
const ROADMAP_MENTOR_SYSTEM_PROMPT = `You are an expert tech career mentor and roadmap architect for college engineering students on DevCollective. Ask ONE short, friendly question at a time to learn their technology/field, skill level, and what they already know. Once you have enough information, call finalize_roadmap with a complete realistic progressive roadmap. Start true beginners with fundamentals and use plain language.`;
const finalizeRoadmapFunctionDeclaration = { name: 'finalize_roadmap', description: 'Generate a personalized learning roadmap after gathering enough student context.', parameters: ROADMAP_JSON_SCHEMA as any };

app.post('/api/ai/roadmap-chat', async (req,res) => { try {
  const { message, history } = req.body as { message:string; history?:{role:'user'|'model';text:string}[] };
  if (!message?.trim()) return res.status(400).json({error:'Message is required.'});
  const ai=getGeminiClient(); if(!ai) return res.status(500).json({error:'GEMINI_API_KEY is not configured on the server. Please add it to your environment variables.'});
  const contents=[...(history||[]).slice(-16).map(h=>({role:h.role,parts:[{text:h.text}]})),{role:'user',parts:[{text:message}]}];
  const response=await ai.models.generateContent({model:AI_MODEL,contents,config:{systemInstruction:ROADMAP_MENTOR_SYSTEM_PROMPT,tools:[{functionDeclarations:[finalizeRoadmapFunctionDeclaration]}]}});
  const functionCalls=response.functionCalls; if(functionCalls?.[0]?.name==='finalize_roadmap') return res.json({success:true,type:'roadmap',roadmap:functionCalls[0].args});
  return res.json({success:true,type:'question',message:response.text||"Could you tell me a bit more about what you're interested in?"});
} catch(err:any){ console.error(err); return res.status(500).json({error:friendlyAiError(err)}); } });

app.patch('/api/users/profile', requireAuth, (req,res)=>{ try {
  const authUser=(req as any).authUser; const allowed=['branch','academicYear','githubUrl','linkedinUrl','skills','bio','selectedDomains','avatar','college','name']; const updates:any={};
  for(const field of allowed) if(field in req.body) updates[field]=req.body[field];
  const updated=updateUser(authUser.id,updates); if(!updated) return res.status(404).json({error:'User not found.'}); return res.json({success:true,user:sanitizeUser(updated)});
} catch(err:any){return res.status(500).json({error:err.message||'Failed to update profile.'});} });

app.post('/api/resume/parse', requireAuth, upload.single('resume'), async(req,res)=>{ try {
  if(!req.file) return res.status(400).json({error:'No resume file uploaded.'}); const ai=getGeminiClient(); if(!ai) return res.status(500).json({error:'GEMINI_API_KEY is not configured on the server. Please add it to your environment variables.'});
  const {PDFParse}=await import('pdf-parse'); const parser=new PDFParse({data:req.file.buffer}); const textResult=await parser.getText(); await parser.destroy(); const resumeText=textResult.text.slice(0,15000); if(!resumeText.trim()) return res.status(422).json({error:'Could not extract any text from this PDF.'});
  const response=await ai.models.generateContent({model:AI_MODEL,contents:`Here is the raw extracted text from a student's resume:\n\n"""\n${resumeText}\n"""`,config:{systemInstruction:'Extract accurate structured profile data only. Never fabricate details.',responseMimeType:'application/json',responseSchema:{type:Type.OBJECT,properties:{branch:{type:Type.STRING},academicYear:{type:Type.STRING},bio:{type:Type.STRING},skills:{type:Type.ARRAY,items:{type:Type.STRING}},githubUrl:{type:Type.STRING},linkedinUrl:{type:Type.STRING},confidence:{type:Type.STRING}},required:['branch','academicYear','bio','skills','githubUrl','linkedinUrl']}}});
  return res.json({success:true,extracted:JSON.parse(response.text||'{}')});
} catch(err:any){console.error(err);return res.status(500).json({error:friendlyAiError(err)});} });

app.post('/api/chat', async(req,res)=>{ try { const {message,history}=req.body; if(!message?.trim()) return res.status(400).json({error:'Message is required.'}); const ai=getGeminiClient(); if(!ai) return res.status(500).json({error:'GEMINI_API_KEY is not configured on the server. Please add it to your environment variables.'}); const response=await ai.models.generateContent({model:AI_MODEL,contents:[...(history||[]).slice(-10).map((h:any)=>({role:h.role,parts:[{text:h.text}]})),{role:'user',parts:[{text:message}]}],config:{systemInstruction:'You are the DevCollective Platform Assistant. Answer platform questions accurately and guide students to Dashboard, Community, Roadmaps, Leaderboard, Mentors, and Profile. Keep answers concise and grounded.'}}); return res.json({success:true,reply:response.text||"Sorry, I couldn't generate a response."}); } catch(err:any){return res.status(500).json({error:friendlyAiError(err)});} });

app.get('/api/auth/info',(req,res)=>{const baseUrl=getAppBaseUrl(req);res.json({appUrl:baseUrl,authType:'native_email_password',googleConfigured:Boolean(GOOGLE_CLIENT_ID&&GOOGLE_CLIENT_SECRET),githubConfigured:Boolean(GITHUB_CLIENT_ID&&GITHUB_CLIENT_SECRET),googleCallbackUrl:`${baseUrl}/api/auth/google/callback`,githubCallbackUrl:`${baseUrl}/api/auth/github/callback`,message:'Native Email/Password Authentication Active'});});

// Student registration is intentionally the only public registration path.
app.post('/api/auth/register',async(req,res)=>{try{const {name,email,password,college,branch,academicYear}=req.body;if(!name||!email||!password)return res.status(400).json({error:'Name, email, and password are required.'});if(password.length<6)return res.status(400).json({error:'Password must be at least 6 characters long.'});if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Please enter a valid email address.'});const newUser=await createUser({name,email,passwordRaw:password,role:'student',college:college||'Institute of Technology',branch:branch||'Computer Science',academicYear:academicYear||'1st Year'});const token=createSession(newUser.id);return res.status(201).json({user:sanitizeUser(newUser),token,message:'Account created successfully.'});}catch(err:any){return res.status(400).json({error:err.message||'Registration failed.'});}});

// Admin creates an invitation; the raw token is returned only to the admin in the response and is never stored.
app.post('/api/admin/faculty-invitations',requireAuth,requireAdmin,async(req,res)=>{try{const {email,college}=req.body;const normalized=String(email||'').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))return res.status(400).json({error:'A valid faculty email address is required.'});const admin=(req as any).authUser;const {invitation,token}=createFacultyInvitation(normalized,college||'GHRCEMN',admin.id);const inviteUrl=`${getAppBaseUrl(req)}/?invite=${encodeURIComponent(token)}`;const transporter=getMailTransporter();if(transporter)await transporter.sendMail({from:`"DevCollective" <${process.env.EMAIL_USER}>`,to:normalized,subject:'DevCollective faculty invitation',text:`You have been invited to join DevCollective as faculty. Complete registration here: ${inviteUrl}. This invitation expires in 7 days.`,html:`<div style="font-family:sans-serif"><h2>DevCollective Faculty Invitation</h2><p>You have been invited to join DevCollective as faculty.</p><p><a href="${inviteUrl}">Complete Faculty Registration</a></p><p>This invitation expires in 7 days.</p></div>`});return res.status(201).json({success:true,inviteUrl,emailSent:Boolean(transporter),expiresAt:invitation.expiresAt});}catch(err:any){return res.status(400).json({error:err.message||'Could not create faculty invitation.'});}});

app.get('/api/faculty/invitations/:token',(req,res)=>{const invitation=getFacultyInvitation(req.params.token);if(!invitation||invitation.status!=='pending')return res.status(404).json({error:'This faculty invitation is invalid or expired.'});return res.json({email:invitation.email,college:invitation.college,expiresAt:invitation.expiresAt});});

app.post('/api/auth/faculty/register',async(req,res)=>{try{const data=req.body;if(!data?.inviteToken||!data?.email||!data?.name||!data?.employeeId||!data?.department||!data?.designation||!data?.password)return res.status(400).json({error:'Invitation, identity, employment, and password fields are required.'});if(String(data.password).length<6)return res.status(400).json({error:'Password must be at least 6 characters long.'});const invitation=getFacultyInvitation(String(data.inviteToken));if(!invitation||invitation.status!=='pending')return res.status(400).json({error:'This faculty invitation is invalid, expired, or already used.'});const email=String(data.email).trim().toLowerCase();if(email!==invitation.email)return res.status(403).json({error:'The registration email must match the invited faculty email address.'});if(getUserByEmail(email))return res.status(409).json({error:'An account with this email address already exists.'});const newUser=await createFacultyUser({...data,email,passwordRaw:String(data.password)});createFacultyProfile({...data,email,passwordRaw:String(data.password)},newUser.id);markFacultyInvitationAccepted(invitation.id);return res.status(201).json({success:true,message:'Faculty registration submitted. Your account is pending admin approval.'});}catch(err:any){console.error(err);return res.status(400).json({error:err.message||'Faculty registration failed.'});}});

app.get('/api/admin/faculty',requireAuth,requireAdmin,(_req,res)=>res.json({profiles:getPendingFacultyProfiles()}));
app.post('/api/admin/faculty/:userId/approve',requireAuth,requireAdmin,(req,res)=>{const user=setFacultyApproval(req.params.userId,'approved',(req as any).authUser.id);if(!user)return res.status(404).json({error:'Faculty account not found.'});return res.json({success:true,user:sanitizeUser(user),profile:getFacultyProfile(user.id)});});
app.post('/api/admin/faculty/:userId/reject',requireAuth,requireAdmin,(req,res)=>{const user=setFacultyApproval(req.params.userId,'rejected',(req as any).authUser.id);if(!user)return res.status(404).json({error:'Faculty account not found.'});return res.json({success:true,user:sanitizeUser(user),profile:getFacultyProfile(user.id)});});

app.post('/api/auth/login',async(req,res)=>{try{const {email,password}=req.body;if(!email||!password)return res.status(400).json({error:'Please enter both email and password.'});const user=getUserByEmail(email);if(!user)return res.status(401).json({error:'Invalid email or password.'});if(user.accountStatus==='pending'&&user.role==='faculty')return res.status(403).json({error:'Your faculty account is pending admin approval.'});if(user.accountStatus==='suspended')return res.status(403).json({error:'This account has been suspended.'});if(!user.passwordHash){const provider=user.authProvider==='google'?'Google':user.authProvider==='github'?'GitHub':'a social account';return res.status(401).json({error:`This account was created with ${provider}. Please use the "${provider}" button to sign in instead.`});}if(!await bcrypt.compare(password,user.passwordHash))return res.status(401).json({error:'Invalid email or password.'});const token=createSession(user.id);return res.json({user:sanitizeUser(user),token,message:'Logged in successfully.'});}catch(err:any){return res.status(500).json({error:'Server error during login.'});}});

app.get('/api/auth/me',(req,res)=>{const token=req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.substring(7):'';const user=getUserByToken(token);if(!user)return res.status(401).json({error:'Session expired or invalid.'});return res.json({user:sanitizeUser(user)});});
app.post('/api/auth/logout',(req,res)=>{const token=req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.substring(7):'';if(token)deleteSession(token);return res.json({success:true,message:'Logged out successfully.'});});

// Existing OAuth flow retained.
app.get('/api/auth/google',(req,res)=>{if(!GOOGLE_CLIENT_ID||!GOOGLE_CLIENT_SECRET)return res.redirect(`/?authError=${encodeURIComponent('Google sign-in is not configured on this server yet.')}`);const redirectUri=`${getAppBaseUrl(req)}/api/auth/google/callback`;const params=new URLSearchParams({client_id:GOOGLE_CLIENT_ID,redirect_uri:redirectUri,response_type:'code',scope:'openid email profile',prompt:'select_account'});res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);});
app.get('/api/auth/google/callback',async(req,res)=>{try{const code=req.query.code as string|undefined;if(!code)return res.redirect(`/?authError=${encodeURIComponent('Google sign-in was cancelled or failed.')}`);const redirectUri=`${getAppBaseUrl(req)}/api/auth/google/callback`;const tokenRes=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:GOOGLE_CLIENT_ID,client_secret:GOOGLE_CLIENT_SECRET,redirect_uri:redirectUri,grant_type:'authorization_code'})});const tokenData:any=await tokenRes.json();if(!tokenRes.ok||!tokenData.access_token)return res.redirect(`/?authError=${encodeURIComponent('Could not complete Google sign-in.')}`);const profileRes=await fetch('https://www.googleapis.com/oauth2/v2/userinfo',{headers:{Authorization:`Bearer ${tokenData.access_token}`}});const profile:any=await profileRes.json();if(!profile.email)return res.redirect(`/?authError=${encodeURIComponent('Google did not share an email address.')}`);const {user,isNewUser}=await findOrCreateOAuthUser({provider:'google',email:profile.email,name:profile.name||profile.email.split('@')[0],avatar:profile.picture});const token=createSession(user.id);return res.redirect(`/?token=${encodeURIComponent(token)}${isNewUser?'&newUser=1':''}`);}catch(err){console.error(err);return res.redirect(`/?authError=${encodeURIComponent('Something went wrong during Google sign-in.')}`);}});
app.get('/api/auth/github',(req,res)=>{if(!GITHUB_CLIENT_ID||!GITHUB_CLIENT_SECRET)return res.redirect(`/?authError=${encodeURIComponent('GitHub sign-in is not configured on this server yet.')}`);const redirectUri=`${getAppBaseUrl(req)}/api/auth/github/callback`;const params=new URLSearchParams({client_id:GITHUB_CLIENT_ID,redirect_uri:redirectUri,scope:'read:user user:email'});res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);});
app.get('/api/auth/github/callback',async(req,res)=>{try{const code=req.query.code as string|undefined;if(!code)return res.redirect(`/?authError=${encodeURIComponent('GitHub sign-in was cancelled or failed.')}`);const redirectUri=`${getAppBaseUrl(req)}/api/auth/github/callback`;const tokenRes=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({client_id:GITHUB_CLIENT_ID,client_secret:GITHUB_CLIENT_SECRET,code,redirect_uri:redirectUri})});const tokenData:any=await tokenRes.json();if(!tokenRes.ok||!tokenData.access_token)return res.redirect(`/?authError=${encodeURIComponent('Could not complete GitHub sign-in.')}`);const profileRes=await fetch('https://api.github.com/user',{headers:{Authorization:`Bearer ${tokenData.access_token}`,Accept:'application/vnd.github+json'}});const profile:any=await profileRes.json();let email:string|undefined=profile.email;if(!email){const emailsRes=await fetch('https://api.github.com/user/emails',{headers:{Authorization:`Bearer ${tokenData.access_token}`,Accept:'application/vnd.github+json'}});const emails:any[]=await emailsRes.json();email=Array.isArray(emails)?(emails.find((e)=>e.primary&&e.verified)?.email||emails[0]?.email):undefined;}if(!email)return res.redirect(`/?authError=${encodeURIComponent('GitHub did not share a verified email address.')}`);const {user,isNewUser}=await findOrCreateOAuthUser({provider:'github',email,name:profile.name||profile.login||email.split('@')[0],avatar:profile.avatar_url});const token=createSession(user.id);return res.redirect(`/?token=${encodeURIComponent(token)}${isNewUser?'&newUser=1':''}`);}catch(err){console.error(err);return res.redirect(`/?authError=${encodeURIComponent('Something went wrong during GitHub sign-in.')}`);}});

app.post('/api/auth/forgot-password',async(req,res)=>{try{const {email}=req.body;if(!email)return res.status(400).json({error:'Email is required.'});const transporter=getMailTransporter();if(!transporter)return res.status(500).json({error:'Email sending is not configured on this server yet.'});const user=getUserByEmail(email);if(!user||!user.passwordHash)return res.json({success:true,message:'If an account exists for that email, a verification code has been sent.'});const code=String(Math.floor(100000+Math.random()*900000));const codeHash=await bcrypt.hash(code,10);const expiresAt=new Date(Date.now()+10*60*1000).toISOString();setPasswordResetCode(user.id,codeHash,expiresAt);await transporter.sendMail({from:`"DevCollective" <${process.env.EMAIL_USER}>`,to:user.email,subject:'Your DevCollective password reset code',text:`Your DevCollective password reset code is ${code}. It expires in 10 minutes.`});return res.json({success:true,message:'If an account exists for that email, a verification code has been sent.'});}catch(err){return res.status(500).json({error:'Could not send the verification email right now. Please try again shortly.'});}});
app.post('/api/auth/reset-password',async(req,res)=>{try{const {email,code,newPassword}=req.body;if(!email||!code||!newPassword)return res.status(400).json({error:'Email, code, and new password are all required.'});if(newPassword.length<6)return res.status(400).json({error:'Password must be at least 6 characters long.'});const result=await resetPasswordWithCode(email,code,newPassword);if(!result.success)return res.status(400).json({error:result.error||'Could not reset password.'});return res.json({success:true,message:'Password updated successfully. You can now log in with your new password.'});}catch(err){return res.status(500).json({error:'Could not reset the password right now. Please try again.'});}});

async function startServer(){if(process.env.NODE_ENV!=='production'){const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}else{const distPath=path.join(process.cwd(),'dist');app.use(express.static(distPath));app.get('*',(_req,res)=>res.sendFile(path.join(distPath,'index.html')));}app.listen(PORT,'0.0.0.0',()=>console.log(`DevCollective Server running on http://0.0.0.0:${PORT}`));}
startServer();
export type Level0ResourceType = 'video' | 'documentation' | 'practice' | 'article';

export interface Level0Resource { id: string; title: string; type: Level0ResourceType; provider?: string; url: string; embedUrl?: string; description: string; }
export interface Level0Submodule { id: string; title: string; description: string; estimatedMinutes: number; kind: 'theory' | 'interactive' | 'practical' | 'reflection' | 'assessment'; content: string[]; resources?: Level0Resource[]; repReward: number; }
export interface Level0Module { id: string; order: number; title: string; description: string; icon: string; estimatedMinutes: number; repReward: number; submodules: Level0Submodule[]; }

export const LEVEL_0_MODULES: Level0Module[] = [];
export const LEVEL_0_ID = 'level-0';
export const LEVEL_0_TITLE = 'CSE Foundations';
export const LEVEL_0_SUBTITLE = 'Mandatory foundation before specialization';
export const LEVEL_0_MODULE_COUNT = LEVEL_0_MODULES.length;

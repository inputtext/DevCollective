create or replace function public.reject_duplicate_question()
returns trigger
language plpgsql
as $$
declare
  duplicate_id uuid;
  duplicate_title text;
  duplicate_similarity real;
begin
  if NEW.category <> 'Questions' or NEW.embedding is null then
    return NEW;
  end if;

  select d.id, d.title, d.similarity
    into duplicate_id, duplicate_title, duplicate_similarity
  from public.find_duplicate_questions(
    NEW.embedding,
    null,
    0.84,
    1
  ) as d
  limit 1;

  if duplicate_id is not null then
    raise exception 'Possible duplicate question detected: %%% similarity with "%".',
      round(duplicate_similarity * 100)::integer,
      coalesce(duplicate_title, 'Existing community question')
      using errcode = '23505',
            hint = 'Review the existing question before posting or rephrase your question.';
  end if;

  return NEW;
end;
$$;

drop trigger if exists devcollective_posts_duplicate_question_guard
  on public.devcollective_posts;

create trigger devcollective_posts_duplicate_question_guard
before insert on public.devcollective_posts
for each row
execute function public.reject_duplicate_question();

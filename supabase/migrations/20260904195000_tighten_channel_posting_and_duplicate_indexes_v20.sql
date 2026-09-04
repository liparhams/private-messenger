begin;

-- Keep one composite read-receipt index. The primary key already covers (message_id,user_id).
drop index if exists public.message_reads_user_message_idx;

-- Channel posts are allowed for channel owners/admins, while ordinary group members
-- can continue posting to groups. Direct messages remain restricted to the two members.
drop policy if exists messages_insert_sender_v7 on public.messages;
create policy messages_insert_sender_v8
on public.messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and conversation_id is not null
  and private.is_conversation_member(conversation_id)
  and (
    (
      message_type = 'text'
      and length(trim(coalesce(content,''))) between 1 and 4000
      and file_url is null
      and file_name is null
      and file_type is null
    )
    or
    (
      message_type = 'file'
      and file_url is not null
      and (storage.foldername(file_url))[1] = (select auth.uid())::text
      and length(trim(coalesce(file_name,''))) between 1 and 120
      and file_type is not null
    )
  )
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (
        (
          c.type = 'direct'
          and c.is_channel = false
          and messages.receiver_id is not null
          and messages.receiver_id <> (select auth.uid())
          and exists (
            select 1
            from public.conversation_members cm
            where cm.conversation_id = c.id
              and cm.user_id = messages.receiver_id
              and cm.left_at is null
          )
        )
        or
        (
          c.type = 'group'
          and messages.receiver_id is null
          and (
            not c.is_channel
            or c.created_by = (select auth.uid())
            or exists (
              select 1
              from public.conversation_members cm
              where cm.conversation_id = c.id
                and cm.user_id = (select auth.uid())
                and cm.left_at is null
                and cm.role in ('owner','admin')
            )
          )
        )
      )
  )
);

commit;

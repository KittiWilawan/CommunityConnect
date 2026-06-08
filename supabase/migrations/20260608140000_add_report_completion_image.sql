-- Add completion evidence image for admin when marking report as done
alter table public.reports
  add column if not exists completion_image text;

-- Allow report owners to update their own reports (description, contact, image, status on resubmit)
create policy "Allow owners to update their own reports" on public.reports
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

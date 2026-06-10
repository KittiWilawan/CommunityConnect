-- 1. Drop existing check constraint if it exists
alter table public.reports drop constraint if exists reports_status_check;

-- 2. Add new check constraint with 'ปฏิเสธ'
alter table public.reports add constraint reports_status_check check (status in ('รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น', 'ขอข้อมูลเพิ่ม', 'ปฏิเสธ'));

-- 3. Add columns for timestamps of each status change
alter table public.reports add column if not exists processing_at timestamp with time zone;
alter table public.reports add column if not exists info_requested_at timestamp with time zone;
alter table public.reports add column if not exists completed_at timestamp with time zone;
alter table public.reports add column if not exists rejected_at timestamp with time zone;

-- 4. Add rejection reason column
alter table public.reports add column if not exists rejection_reason text;

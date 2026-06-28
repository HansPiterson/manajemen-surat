-- Rename old columns if they exist
DO $$
BEGIN
  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='surat_ekspedisi' and column_name='foto_bukti')
  THEN
      ALTER TABLE "public"."surat_ekspedisi" RENAME COLUMN "foto_bukti" TO "foto_bukti_url";
  END IF;

  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='surat_ekspedisi' and column_name='foto_original')
  THEN
      ALTER TABLE "public"."surat_ekspedisi" RENAME COLUMN "foto_original" TO "foto_original_url";
  END IF;
END $$;

-- Add them if they still don't exist
ALTER TABLE public.surat_ekspedisi ADD COLUMN IF NOT EXISTS foto_bukti_url text;
ALTER TABLE public.surat_ekspedisi ADD COLUMN IF NOT EXISTS foto_original_url text;
ALTER TABLE public.surat_ekspedisi ADD COLUMN IF NOT EXISTS foto_hash text;
ALTER TABLE public.surat_ekspedisi ADD COLUMN IF NOT EXISTS uuid uuid default gen_random_uuid();

-- ============================================================
-- SQL: Limpieza de Columnas Redundantes
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Eliminar la columna can_upload_files ya que ahora usamos subscription_status
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS can_upload_files;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_patient_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_app_id TEXT;
    v_action TEXT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        v_action := 'CREATE_PATIENT';
        v_app_id := NEW.app_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_action := 'UPDATE_PATIENT';
        v_app_id := NEW.app_id;
    ELSIF (TG_OP = 'DELETE') THEN
        v_action := 'DELETE_PATIENT';
        v_app_id := OLD.app_id;
    END IF;

    INSERT INTO public.audit_logs (app_id, user_id, patient_id, action, details)
    VALUES (
        v_app_id,
        v_user_id,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        v_action,
        jsonb_build_object(
            'op', TG_OP,
            'name', CASE WHEN TG_OP = 'DELETE' THEN OLD.name ELSE NEW.name END,
            'timestamp', NOW()
        )
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_patient_change_audit ON public.patients;
CREATE TRIGGER on_patient_change_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.handle_patient_audit_log();

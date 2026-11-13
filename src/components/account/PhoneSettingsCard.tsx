import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhoneField } from "@/components/forms/PhoneField";
import { useToast } from "@/hooks/use-toast";
import { PHONE_ERROR, phoneOk, showPhone, toStoredPhone } from "@/lib/phone";

/** Settings: the account's optional phone number (founder request, Nov 12, 2026). Only the person and the team see it. */
export function PhoneSettingsCard({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [saved, setSaved] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    supabase.from("profiles").select("phone").eq("user_id", userId).maybeSingle().then(({ data }) => {
      if (!live) return;
      const phone = (data as { phone: string | null } | null)?.phone ?? null;
      setSaved(phone);
      setValue(showPhone(phone) ?? "");
      setLoaded(true);
    });
    return () => { live = false; };
  }, [userId]);

  const next = toStoredPhone(value);
  const changed = loaded && (value.trim() ? next !== saved : !!saved);

  const save = async () => {
    if (!phoneOk(value)) { setError(PHONE_ERROR); return; }
    setBusy(true);
    const { error: saveError } = await supabase.from("profiles").update({ phone: next }).eq("user_id", userId);
    setBusy(false);
    if (saveError) { toast({ title: "Couldn't save your phone number", description: "Please try again.", variant: "destructive" }); return; }
    setSaved(next);
    toast({ title: next ? "Phone number saved" : "Phone number removed" });
  };

  return (
    <Card className="mb-6 rounded-md shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" />Phone number</CardTitle>
        <CardDescription>So our team can reach you quickly about your fundraiser or your gifts. Only you and the CouponDonation team can see it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <PhoneField id="settings-phone" value={value} onChange={(v) => { setValue(v); setError(null); }} error={error} />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={!changed || busy} onClick={save}>{busy ? "Saving…" : value.trim() ? "Save phone number" : "Remove phone number"}</Button>
          {changed && <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setValue(showPhone(saved) ?? ""); setError(null); }}>Cancel</Button>}
        </div>
      </CardContent>
    </Card>
  );
}

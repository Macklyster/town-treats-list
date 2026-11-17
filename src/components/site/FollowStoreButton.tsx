import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  storeId: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function FollowStoreButton({ storeId, size = "sm", className }: Props) {
  const { user } = useAuth();
  const [following, setFollowing] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setFollowing(false); return; }
    (async () => {
      const { data } = await supabase.from("store_followers")
        .select("id").eq("user_id", user.id).eq("store_id", storeId).maybeSingle();
      setFollowing(!!data);
    })();
  }, [user?.id, storeId]);

  if (!user) {
    return (
      <Button asChild size={size} variant="outline" className={className}>
        <Link to="/auth"><Bell className="h-4 w-4" /> Seguir loja</Link>
      </Button>
    );
  }

  const toggle = async () => {
    if (following === null) return;
    setLoading(true);
    if (following) {
      const { error } = await supabase.from("store_followers")
        .delete().eq("user_id", user.id).eq("store_id", storeId);
      if (error) toast.error(error.message);
      else { setFollowing(false); toast.success("Você deixou de seguir a loja"); }
    } else {
      const { error } = await supabase.from("store_followers")
        .insert({ user_id: user.id, store_id: storeId });
      if (error) toast.error(error.message);
      else { setFollowing(true); toast.success("Pronto! Você receberá novidades da loja"); }
    }
    setLoading(false);
  };

  return (
    <Button
      size={size}
      variant={following ? "outline" : "accent"}
      className={className}
      onClick={toggle}
      disabled={loading || following === null}
    >
      <Bell className="h-4 w-4" />
      {following ? "Seguindo" : "Seguir loja"}
    </Button>
  );
}

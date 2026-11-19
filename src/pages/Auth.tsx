import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "@/lib/router-compat";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SEO } from "@/components/seo/SEO";

const emailSchema = z.string().trim().email("E-mail inválido").max(255);
const passwordSchema = z.string().min(8, "Mínimo 8 caracteres").max(72);
const nameSchema = z.string().trim().min(2, "Informe seu nome").max(100);

export default function Auth() {
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/painel-lojista";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message ?? "Dados inválidos");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bem-vindo!");
    navigate(redirect, { replace: true });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      nameSchema.parse(fullName);
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message ?? "Dados inválidos");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    setLoading(false);
    toast.success("Conta de lojista criada!");
    navigate("/painel-lojista", { replace: true });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + redirect,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Não foi possível entrar com Google");
      return;
    }
    if (result.redirected) return;
    navigate(redirect, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Entrar ou criar conta — Lojistas | OfertasFly"
        description="Acesse o painel do lojista da OfertasFly para gerenciar sua loja, publicar ofertas e acompanhar resultados."
        path="/auth"
        noindex
      />
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md rounded-3xl border-border bg-card shadow-card">
          <CardHeader className="space-y-2 pb-2">
            <span className="label-eyebrow text-highlight">Área do lojista</span>
            <h1 className="font-display text-2xl font-medium leading-none">Acesse o OfertasFly</h1>
            <p className="text-sm text-muted-foreground">Entre ou crie sua conta para gerenciar sua loja.</p>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" variant="accent" disabled={loading}>
                    Entrar
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Cadastre-se para anunciar suas ofertas no OfertasFly.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="su-name">Nome completo</Label>
                    <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">E-mail</Label>
                    <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-password">Senha</Label>
                    <Input id="su-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                    <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
                  </div>
                  <Button type="submit" className="w-full" variant="accent" disabled={loading}>
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
              Continuar com Google
            </Button>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Ao continuar, você concorda com nossos{" "}
              <Link to="/" className="underline">Termos</Link>.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

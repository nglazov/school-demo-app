"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginAction, signupAction } from "./actions";
import { useEffect, useState } from "react";

export default function AuthPage() {
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const initialTab = (sp.get("mode") === "signup" ? "signup" : "login") as
    | "login"
    | "signup";
  const [tab, setTab] = useState<"login" | "signup">(initialTab);

  const [loginState, loginAct, loginPending] = useActionState(loginAction, {
    ok: false,
    message: "",
  });
  const [signupState, signupAct, signupPending] = useActionState(signupAction, {
    ok: false,
    message: "",
  });

  useEffect(() => setTab(initialTab), [initialTab]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Добро пожаловать</CardTitle>
          <CardDescription>Войдите или создайте аккаунт</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as any)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="signup">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form action={loginAct} className="space-y-3">
                <input type="hidden" name="next" value={next} />
                <div className="space-y-1.5">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    name="username"
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password">Пароль</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
                {loginState?.message && !loginPending && (
                  <p className="text-sm text-red-600">{loginState.message}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginPending}
                >
                  {loginPending ? "Входим..." : "Войти"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form action={signupAct} className="space-y-3">
                <input type="hidden" name="next" value={next} />
                <div className="space-y-1.5">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    name="username"
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Пароль</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                </div>
                {signupState?.message && !signupPending && (
                  <p className="text-sm text-red-600">{signupState.message}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={signupPending}
                >
                  {signupPending ? "Создаём..." : "Зарегистрироваться"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}

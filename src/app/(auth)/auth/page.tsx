"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";

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

// Импортируй server actions
import { loginAction, signupAction } from "./actions";

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

export default function AuthPage() {
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const initialTab = (sp.get("mode") === "signup" ? "signup" : "login") as
    | "login"
    | "signup";
  const [tab, setTab] = useState<"login" | "signup">(initialTab);

  // useFormState ожидает (prevState, formData) сигнатуру у server action
  const [loginState, loginFormAction] = useActionState(loginAction, {});
  const [signupState, signupFormAction] = useActionState(signupAction, {});

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
              <form action={loginFormAction} className="space-y-3">
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
                {loginState?.error && (
                  <p className="text-sm text-red-600">{loginState.error}</p>
                )}
                <SubmitButton idle="Войти" busy="Входим..." />
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form action={signupFormAction} className="space-y-3">
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
                {signupState?.error && (
                  <p className="text-sm text-red-600">{signupState.error}</p>
                )}
                <SubmitButton idle="Зарегистрироваться" busy="Создаём..." />
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}

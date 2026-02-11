import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>pnp-app</CardTitle>
          <CardDescription>Next.js + Tailwind + shadcn/ui ist bereit.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Passe als Nächstes <code>.env.local</code> mit deinen Supabase-Werten an.
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline">Sekundär</Button>
          <Button>Primär</Button>
        </CardFooter>
      </Card>
    </main>
  );
}

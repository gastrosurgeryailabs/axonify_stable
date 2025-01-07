import SignInButton from "@/components/SignInButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/nextauth";
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getAuthSession();
  if (session?.user){
    // user is signed in
    return redirect('/dashboard');
  }
  return (
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
    <Card className="w-[300px]">
    <CardHeader>
      <CardTitle>Welcome to Axonify! ✨</CardTitle>
      <CardDescription>
        <p>Axonify is a quiz app where you pick your favorite topics, set the number of questions, choose your language, and dive into exciting challenges!</p>
      </CardDescription>
    </CardHeader>
    <CardContent>
    <SignInButton text= "Sign In with Google!" />
    </CardContent>
    </Card>
  </div>
  );
}
  
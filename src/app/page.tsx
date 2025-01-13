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
      <CardTitle>Welcome to AxonCare! ✨</CardTitle>
      <CardDescription>
        <p>Welcome to AxonCare's Knowledge Assessment Platform. Enhance your understanding, track your progress, and challenge yourself through our comprehensive assessment system.</p>
      </CardDescription>
    </CardHeader>
    <CardContent>
    <SignInButton text= "Sign In with Google!" />
    </CardContent>
    </Card>
  </div>
  );
}
  
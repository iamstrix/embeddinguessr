import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp } from "@clerk/react";
import type { Appearance } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Leaderboard from "@/pages/leaderboard";
import Stats from "@/pages/stats";
import Endless from "@/pages/endless";
import { Layout } from "@/components/layout";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkAppearance: Appearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "#3399ff",
    colorBackground: "#08090f",
    colorInputBackground: "#0f1117",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "rgba(255,255,255,0.5)",
    colorDanger: "#ef4444",
    fontFamily: '"Space Mono", "Courier New", monospace',
    borderRadius: "0.75rem",
    colorNeutral: "#ffffff",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "shadow-2xl",
    card: "bg-[#08090f] border border-white/10 !shadow-none",
    headerTitle: "text-white font-mono",
    headerSubtitle: "text-white/50 font-mono",
    socialButtonsBlockButton:
      "border border-white/10 bg-white/5 hover:bg-white/10 text-white",
    socialButtonsBlockButtonText: "text-white font-mono",
    formFieldLabel: "text-white/60 font-mono text-xs",
    formFieldInput:
      "bg-[#0f1117] border border-white/15 text-white font-mono focus:border-[#3399ff]/50",
    formButtonPrimary:
      "bg-[#3399ff] hover:bg-[#2288ee] text-white font-mono font-bold",
    footerActionLink:
      "text-[#3399ff] hover:text-[#5599ff] font-mono",
    footerActionText: "text-white/40 font-mono",
    footerAction: "bg-transparent",
    footer: "bg-transparent",
    dividerLine: "bg-white/10",
    dividerText: "text-white/30 font-mono",
    identityPreviewText: "text-white font-mono",
    identityPreviewEditButton: "text-[#3399ff]",
    formResendCodeLink: "text-[#3399ff]",
    alertText: "font-mono",
    otpCodeFieldInput:
      "bg-[#0f1117] border border-white/15 text-white font-mono",
    logoBox: "flex justify-center",
    logoImage: "h-10 w-auto",
  },
};

function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4 pt-24">
        {mode === "sign-in" ? (
          <SignIn
            routing="hash"
            appearance={clerkAppearance}
            fallbackRedirectUrl={`${basePath}/`}
            signUpUrl={`${basePath}/sign-up`}
          />
        ) : (
          <SignUp
            routing="hash"
            appearance={clerkAppearance}
            fallbackRedirectUrl={`${basePath}/`}
            signInUrl={`${basePath}/sign-in`}
          />
        )}
      </div>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/endless" component={Endless} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/stats" component={Stats} />
      <Route path="/sign-in">
        <AuthPage mode="sign-in" />
      </Route>
      <Route path="/sign-up">
        <AuthPage mode="sign-up" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      proxyUrl={`${window.location.origin}/api/__clerk`}
      appearance={clerkAppearance}
    >
      <WouterRouter base={basePath}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Router />
          </TooltipProvider>
          <Toaster />
        </QueryClientProvider>
      </WouterRouter>
    </ClerkProvider>
  );
}

export default App;

import { SignIn } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export default function SignInPage() {
  const params = new URLSearchParams(window.location.search);
  const redirectUrl = params.get("redirect_url") ?? `${basePath}/`;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#05070a] px-4">
      {!isLocalhost && import.meta.env.DEV ? (
        <div className="w-full max-w-sm text-center space-y-4 border border-white/10 rounded-2xl p-8 bg-white/3">
          <div className="text-4xl">🔒</div>
          <h2 className="font-mono font-bold text-white text-lg">Sign-in preview</h2>
          <p className="font-mono text-white/50 text-sm leading-relaxed">
            Clerk authentication only works on <span className="text-primary font-bold">localhost</span> or the{" "}
            <span className="text-primary font-bold">published app</span> — not in the Replit dev preview.
          </p>
          <p className="font-mono text-white/35 text-xs leading-relaxed">
            Publish the app to test sign-in end-to-end. The sign-in form will appear correctly on the live URL.
          </p>
          <a
            href={`${basePath}/`}
            className="block w-full py-2.5 rounded-lg bg-white/5 border border-white/10 font-mono text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            ← Back to game
          </a>
        </div>
      ) : (
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
          forceRedirectUrl={redirectUrl}
        />
      )}
    </div>
  );
}

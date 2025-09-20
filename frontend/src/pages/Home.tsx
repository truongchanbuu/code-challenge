export default function Home() {
  return (
    <div className="grid min-h-dvh place-items-center p-10">
      <div className="space-y-3 text-center">
        <h1 className="text-2xl font-semibold">Home</h1>
        <a href="/login" className="text-primary underline">
          Go to Login Page
        </a>
      </div>
    </div>
  );
}

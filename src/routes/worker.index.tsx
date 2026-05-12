import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/worker/")({
  beforeLoad: () => {
    throw redirect({ to: "/worker/home" });
  },
});

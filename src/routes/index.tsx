import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Financeiro EJC — Gestão financeira do encontro" },
    { name: "description", content: "Acesse a gestão financeira do EJC Santa Mônica e Santa Elena Guerra." },
    { property: "og:title", content: "Financeiro EJC — Gestão financeira do encontro" },
    { property: "og:description", content: "Acesse a gestão financeira do EJC Santa Mônica e Santa Elena Guerra." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});

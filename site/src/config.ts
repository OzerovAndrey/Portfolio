// Дані, які надає Андрій (бриф, розділ 8). Порожнє поле = блок на сайті не показується.
type Contacts = { email: string; linkedin: string; telegram: string; calcom: string };

export const config = {
  name: "Andrey Ozerov",
  demoUrl: "https://ozerovandrey.github.io/multibrand-design-system/",
  // Formspree / Resend endpoint. Можна задати через PUBLIC_FORM_ENDPOINT у GitHub → Settings → Variables.
  formEndpoint: (import.meta.env.PUBLIC_FORM_ENDPOINT as string | undefined) ?? "",
  contacts: {
    email: "",
    linkedin: "",
    telegram: "",
    calcom: "",
  } satisfies Contacts as Contacts,
};

export type Link = { label: string; url: string };
/** Прибирає порожні контакти: link("Email", email && `mailto:${email}`) */
export const links = (...items: [label: string, url: string | false | ""][]): Link[] =>
  items.filter((i): i is [string, string] => Boolean(i[1])).map(([label, url]) => ({ label, url }));

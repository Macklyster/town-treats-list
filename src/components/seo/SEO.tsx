import { Helmet } from "react-helmet-async";
import { absoluteUrl } from "@/lib/slug";

type SEOProps = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
};

const DEFAULT_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/65f44c74-abe4-46f6-a8d9-13c46531593e/id-preview-3b8fa968--934a5999-9206-4081-8a15-19b03ff711c8.lovable.app-1777863985812.png";

export const SEO = ({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  noindex,
  jsonLd,
}: SEOProps) => {
  const url = absoluteUrl(path);
  const t = title.length > 60 ? title.slice(0, 57) + "…" : title;
  const d = description.length > 160 ? description.slice(0, 157) + "…" : description;
  const ld = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
      <meta name="twitter:image" content={image} />
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
};

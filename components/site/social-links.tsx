import Image from "next/image";
import { site, socialProfiles } from "@/lib/site";

export function SocialLinks() {
  const treatment = "inline-flex size-12 items-center justify-center rounded-full border border-gold/40 bg-gold/5";
  return <div><div className="flex flex-wrap gap-3" aria-label="Sanbay Fusion social profiles">
    {socialProfiles.map(profile => {
      const icon = <Image src={`/brand/social/${profile.id}.svg`} width={21} height={21} alt="" unoptimized aria-hidden="true" />;
      return profile.url
        ? <a key={profile.id} href={profile.url} target="_blank" rel="noopener noreferrer" aria-label={`${profile.name}: Sanbay Fusion (opens in a new tab)`} title={profile.name} className={`${treatment} transition-colors hover:border-gold hover:bg-gold/15 motion-safe:transition-transform motion-safe:hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold`}>{icon}</a>
        : <span key={profile.id} role="img" aria-label={`${profile.name}: direct contact link not yet available`} title={`${profile.name}: direct contact link not yet available`} className={`${treatment} border-dashed opacity-50`}>{icon}</span>;
    })}
  </div><p className="mt-4 text-xs leading-6 text-muted-foreground">LINE ID: {site.socialHandle}<br />WhatsApp username: {site.socialHandle}</p></div>;
}

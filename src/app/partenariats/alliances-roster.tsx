import { PlayerLink } from "@/components/player/player-link";
import { Stamp } from "@/components/ui/stamp";
import type { AllianceGroup, AllianceMember } from "@/server/repo/alliances";

function MemberCard({ member }: { member: AllianceMember }) {
  const name = (
    <span className="truncate font-display text-base font-semibold text-bone">
      {member.displayName}
    </span>
  );

  return (
    <li className="flex items-center gap-4 border border-iron-line bg-iron px-4 py-3.5">
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- proxy MC / CDN Discord
        <img
          src={member.avatarUrl}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          className="h-10 w-10 shrink-0 border border-iron-line bg-ash-deep object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center border border-iron-line bg-ash-deep font-tech text-[10px] uppercase tracking-wider text-steel"
        >
          —
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {member.uuid ? (
          <PlayerLink
            uuid={member.uuid}
            className="truncate font-display text-base font-semibold text-bone hover:text-ember-glow"
          >
            {member.displayName}
          </PlayerLink>
        ) : (
          name
        )}
        {member.discordUsername && (
          <span className="truncate font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
            Discord · {member.discordUsername}
          </span>
        )}
      </div>
    </li>
  );
}

export function AlliancesRoster({ groups }: { groups: AllianceGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className="border border-iron-line bg-iron px-5 py-8 sm:px-6">
        <p className="max-w-xl text-sm leading-relaxed text-steel">
          Aucun partenaire ni creator listé pour l&apos;instant — seuls les détenteurs réels des
          rôles Discord <span className="text-bone">Partenaires actifs</span> et{" "}
          <span className="text-bone">Creator</span> apparaissent ici.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <div key={group.grade} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-lg font-semibold text-bone">{group.label}</h3>
            <Stamp tone="steel" rotation={-1}>
              {group.members.length}
            </Stamp>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.members.map((member) => (
              <MemberCard key={member.key} member={member} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

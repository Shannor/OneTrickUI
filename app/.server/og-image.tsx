import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ReactElement } from 'react';
import satori, { type Font } from 'satori';
import type { Aggregate, CharacterSnapshot, Profile, Session } from '~/api';
import {
  ENERGY_BUCKET,
  KINETIC_BUCKET,
  POWER_BUCKET,
  SUBCLASS_BUCKET,
  getExotic,
} from '~/hooks/use-loadout';
import { getItemIconUrl } from '~/lib/utils';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const BUNGIE_ORIGIN = 'https://www.bungie.net';

let cachedFontsPromise: Promise<Font[]> | null = null;
let cachedDefaultBgPromise: Promise<string | null> | null = null;
let cachedFallbackPngPromise: Promise<Buffer> | null = null;

function toBungieUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }
  return `${BUNGIE_ORIGIN}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
}

async function loadFonts(): Promise<Font[]> {
  if (!cachedFontsPromise) {
    cachedFontsPromise = (async () => {
      const fontsDir = path.join(
        process.cwd(),
        'node_modules',
        '@fontsource',
      );
      const [interRegular, interSemiBold, interBold, icelandRegular] =
        await Promise.all([
          fs.readFile(
            path.join(fontsDir, 'inter', 'files', 'inter-latin-400-normal.woff'),
          ),
          fs.readFile(
            path.join(fontsDir, 'inter', 'files', 'inter-latin-600-normal.woff'),
          ),
          fs.readFile(
            path.join(fontsDir, 'inter', 'files', 'inter-latin-800-normal.woff'),
          ),
          fs.readFile(
            path.join(
              fontsDir,
              'iceland',
              'files',
              'iceland-latin-400-normal.woff',
            ),
          ),
        ]);

      return [
        {
          name: 'Inter',
          data: interRegular,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: interSemiBold,
          weight: 600,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: interBold,
          weight: 800,
          style: 'normal',
        },
        {
          name: 'Iceland',
          data: icelandRegular,
          weight: 400,
          style: 'normal',
        },
      ];
    })();
  }
  return cachedFontsPromise;
}

async function loadDefaultBackgroundDataUri(): Promise<string | null> {
  if (!cachedDefaultBgPromise) {
    cachedDefaultBgPromise = (async () => {
      try {
        const bgBuffer = await fs.readFile(
          path.join(process.cwd(), 'public', 'og-image.png'),
        );
        return `data:image/png;base64,${bgBuffer.toString('base64')}`;
      } catch {
        return null;
      }
    })();
  }
  return cachedDefaultBgPromise;
}

export async function getFallbackOgPng(): Promise<Buffer> {
  if (!cachedFallbackPngPromise) {
    cachedFallbackPngPromise = fs.readFile(
      path.join(process.cwd(), 'public', 'og-image.png'),
    );
  }
  return cachedFallbackPngPromise;
}

export async function renderOgElementToPng(
  element: ReactElement,
): Promise<Buffer> {
  const fonts = await loadFonts();
  const svg = await satori(element, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: OG_WIDTH,
    },
  });
  return resvg.render().asPng();
}

function BrandFooter() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        borderTop: '1px solid rgba(148, 163, 184, 0.2)',
        paddingTop: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          style={{
            fontFamily: 'Iceland',
            fontSize: '42px',
            letterSpacing: '2px',
            color: '#f97316',
          }}
        >
          1
        </span>
        <span
          style={{
            fontFamily: 'Iceland',
            fontSize: '42px',
            letterSpacing: '2px',
            color: '#f8fafc',
          }}
        >
          TRICK
        </span>
        <span
          style={{
            fontSize: '18px',
            color: '#94a3b8',
            marginLeft: '8px',
            fontWeight: 600,
          }}
        >
          Destiny 2 PvP Performance Tracker
        </span>
      </div>
      <span
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#cbd5e1',
          letterSpacing: '0.5px',
        }}
      >
        d2onetrick.com
      </span>
    </div>
  );
}

export interface SessionOgCardData {
  session: Session;
  aggregates: Aggregate[];
  profile?: Profile | null;
}

export async function generateSessionOgPng({
  session,
  aggregates,
  profile,
}: SessionOgCardData): Promise<Buffer> {
  const bgDataUri = await loadDefaultBackgroundDataUri();
  const character = profile?.characters?.find(
    (c) => c.id === session.characterId,
  );
  const emblemIconUrl = toBungieUrl(character?.emblemURL);

  const summary = aggregates.reduce(
    (acc, agg) => {
      const p = agg.performance?.[session.characterId];
      if (!p) return acc;
      acc.kills += p.playerStats?.kills?.value ?? 0;
      acc.deaths += p.playerStats?.deaths?.value ?? 0;
      acc.assists += p.playerStats?.assists?.value ?? 0;
      acc.wins += p.playerStats?.standing?.value === 0 ? 1 : 0;
      acc.games += 1;
      return acc;
    },
    { kills: 0, deaths: 0, assists: 0, wins: 0, games: 0 },
  );

  const gamesCount =
    summary.games > 0 ? summary.games : (session.aggregateIds?.length ?? 0);
  const wins = summary.wins;
  const losses = Math.max(0, gamesCount - wins);
  const winRate = gamesCount > 0 ? Math.round((wins / gamesCount) * 100) : 0;
  const kd =
    summary.games > 0
      ? summary.deaths > 0
        ? summary.kills / summary.deaths
        : summary.kills
      : 0;
  const kda =
    summary.games > 0
      ? summary.deaths > 0
        ? (summary.kills + summary.assists) / summary.deaths
        : summary.kills + summary.assists
      : 0;

  const isLive = session.status === 'pending';
  const sessionTitle = session.name || 'Crucible Session';
  const guardianName = profile?.displayName || 'Guardian';
  const characterLabel = [character?.class, character?.currentTitle]
    .filter(Boolean)
    .join(' • ');

  const element = (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: '1200px',
        height: '630px',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        fontFamily: 'Inter',
        overflow: 'hidden',
      }}
    >
      {bgDataUri && (
        <img
          src={bgDataUri}
          width={1200}
          height={630}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '630px',
            objectFit: 'cover',
            opacity: 0.28,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1200px',
          height: '630px',
          background:
            'linear-gradient(135deg, rgba(9,13,22,0.92) 0%, rgba(15,23,42,0.85) 60%, rgba(249,115,22,0.18) 100%)',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '52px 64px',
          position: 'relative',
        }}
      >
        {/* Top Guardian Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {emblemIconUrl ? (
              <img
                src={emblemIconUrl}
                width={64}
                height={64}
                style={{
                  borderRadius: '12px',
                  border: '2px solid rgba(248, 250, 252, 0.25)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  backgroundColor: '#1e293b',
                  border: '2px solid rgba(249, 115, 22, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#f97316',
                }}
              >
                1T
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#f8fafc',
                }}
              >
                {guardianName}
              </span>
              {characterLabel && (
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                  }}
                >
                  {characterLabel}
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 22px',
              borderRadius: '9999px',
              backgroundColor: isLive
                ? 'rgba(249, 115, 22, 0.2)'
                : 'rgba(51, 65, 85, 0.65)',
              border: isLive
                ? '2px solid #f97316'
                : '1.5px solid rgba(148, 163, 184, 0.35)',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '9999px',
                backgroundColor: isLive ? '#f97316' : '#38bdf8',
              }}
            />
            <span
              style={{
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: isLive ? '#fb923c' : '#e2e8f0',
              }}
            >
              {isLive ? 'Active Session' : 'Session Summary'}
            </span>
          </div>
        </div>

        {/* Middle Title & Stats */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
            width: '100%',
          }}
        >
          <div
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              maxWidth: '1050px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {sessionTitle}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '20px',
              width: '100%',
            }}
          >
            {/* Matches Card */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                padding: '22px 26px',
                borderRadius: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid rgba(148, 163, 184, 0.22)',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#94a3b8',
                }}
              >
                Matches
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span
                  style={{
                    fontFamily: 'Iceland',
                    fontSize: '56px',
                    color: '#f8fafc',
                    lineHeight: 1,
                  }}
                >
                  {String(gamesCount)}
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#94a3b8',
                  }}
                >
                  ({wins}W - {losses}L)
                </span>
              </div>
            </div>

            {/* Win Rate Card */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                padding: '22px 26px',
                borderRadius: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid rgba(148, 163, 184, 0.22)',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#94a3b8',
                }}
              >
                Win Rate
              </span>
              <span
                style={{
                  fontFamily: 'Iceland',
                  fontSize: '56px',
                  color: winRate >= 50 ? '#34d399' : '#fbbf24',
                  lineHeight: 1,
                }}
              >
                {`${winRate}%`}
              </span>
            </div>

            {/* K/D Card */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                padding: '22px 26px',
                borderRadius: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid rgba(148, 163, 184, 0.22)',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#94a3b8',
                }}
              >
                K / D Ratio
              </span>
              <span
                style={{
                  fontFamily: 'Iceland',
                  fontSize: '56px',
                  color: '#f8fafc',
                  lineHeight: 1,
                }}
              >
                {kd.toFixed(2)}
              </span>
            </div>

            {/* Efficiency Card */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                padding: '22px 26px',
                borderRadius: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid rgba(148, 163, 184, 0.22)',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#94a3b8',
                }}
              >
                Efficiency
              </span>
              <span
                style={{
                  fontFamily: 'Iceland',
                  fontSize: '56px',
                  color: '#f97316',
                  lineHeight: 1,
                }}
              >
                {kda.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <BrandFooter />
      </div>
    </div>
  );

  return renderOgElementToPng(element);
}

export interface LoadoutOgCardData {
  snapshot: CharacterSnapshot;
  profile?: Profile | null;
}

export async function generateLoadoutOgPng({
  snapshot,
  profile,
}: LoadoutOgCardData): Promise<Buffer> {
  const bgDataUri = await loadDefaultBackgroundDataUri();
  const character = profile?.characters?.find(
    (c) => c.id === snapshot.characterId,
  );
  const emblemIconUrl = toBungieUrl(character?.emblemURL);

  const subclassItem = snapshot.loadout?.[SUBCLASS_BUCKET];
  const subclassIconUrl = toBungieUrl(
    getItemIconUrl(subclassItem?.details) ||
      subclassItem?.details?.baseInfo?.icon,
  );
  const subclassName =
    subclassItem?.details?.baseInfo?.name || subclassItem?.name || 'Subclass';

  const weaponBuckets = [
    { label: 'Kinetic', item: snapshot.loadout?.[KINETIC_BUCKET] },
    { label: 'Energy', item: snapshot.loadout?.[ENERGY_BUCKET] },
    { label: 'Power', item: snapshot.loadout?.[POWER_BUCKET] },
  ];

  const { armor: exoticArmor } = getExotic(snapshot.loadout);
  const exoticArmorIcon = toBungieUrl(
    getItemIconUrl(exoticArmor?.details) ||
      exoticArmor?.details?.baseInfo?.icon,
  );
  const exoticArmorName =
    exoticArmor?.details?.baseInfo?.name || exoticArmor?.name;

  const guardianName = profile?.displayName || 'Guardian';
  const loadoutTitle = snapshot.name || 'Crucible Loadout';

  const element = (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: '1200px',
        height: '630px',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        fontFamily: 'Inter',
        overflow: 'hidden',
      }}
    >
      {bgDataUri && (
        <img
          src={bgDataUri}
          width={1200}
          height={630}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '630px',
            objectFit: 'cover',
            opacity: 0.28,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1200px',
          height: '630px',
          background:
            'linear-gradient(135deg, rgba(9,13,22,0.92) 0%, rgba(15,23,42,0.85) 60%, rgba(249,115,22,0.18) 100%)',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '48px 64px',
          position: 'relative',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {emblemIconUrl && (
              <img
                src={emblemIconUrl}
                width={56}
                height={56}
                style={{
                  borderRadius: '10px',
                  border: '2px solid rgba(248, 250, 252, 0.25)',
                }}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#f8fafc',
                }}
              >
                {guardianName}
              </span>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                }}
              >
                {character?.class ? `${character.class} Loadout` : 'Loadout Snapshot'}
              </span>
            </div>
          </div>

          {/* Subclass + Exotic Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {exoticArmorName && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(234, 179, 8, 0.14)',
                  border: '1.5px solid rgba(234, 179, 8, 0.45)',
                }}
              >
                {exoticArmorIcon && (
                  <img
                    src={exoticArmorIcon}
                    width={36}
                    height={36}
                    style={{ borderRadius: '6px' }}
                  />
                )}
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#fde047',
                  }}
                >
                  {exoticArmorName}
                </span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 18px',
                borderRadius: '12px',
                backgroundColor: 'rgba(30, 41, 59, 0.85)',
                border: '1.5px solid rgba(148, 163, 184, 0.3)',
              }}
            >
              {subclassIconUrl && (
                <img
                  src={subclassIconUrl}
                  width={36}
                  height={36}
                  style={{ borderRadius: '6px' }}
                />
              )}
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#e2e8f0',
                }}
              >
                {subclassName}
              </span>
            </div>
          </div>
        </div>

        {/* Loadout Name + Weapons Grid */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '100%',
          }}
        >
          <div
            style={{
              fontSize: '50px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              maxWidth: '1050px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {loadoutTitle}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '20px',
              width: '100%',
            }}
          >
            {weaponBuckets.map(({ label, item }) => {
              const iconUrl = toBungieUrl(
                getItemIconUrl(item?.details) || item?.details?.baseInfo?.icon,
              );
              const itemName =
                item?.details?.baseInfo?.name || item?.name || 'Empty Slot';
              const itemType =
                item?.details?.baseInfo?.itemTypeDisplayName || label;

              return (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    gap: '16px',
                    padding: '20px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    border: '1.5px solid rgba(148, 163, 184, 0.22)',
                  }}
                >
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      width={76}
                      height={76}
                      style={{
                        borderRadius: '10px',
                        border: '1.5px solid rgba(248, 250, 252, 0.2)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '10px',
                        backgroundColor: '#1e293b',
                      }}
                    />
                  )}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        color: '#f97316',
                      }}
                    >
                      {itemType}
                    </span>
                    <span
                      style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: '#f8fafc',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '210px',
                      }}
                    >
                      {itemName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <BrandFooter />
      </div>
    </div>
  );

  return renderOgElementToPng(element);
}

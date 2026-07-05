// Curated, license-clear titles for Watch Together — public-domain / open
// movies and standard test streams with stable, CORS-friendly URLs. These are
// the only titles that support true synced playback (we own the <video>).
//
// kind: 'mp4' (native) | 'hls' (played via hls.js)
const GS = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample'

export const LEGAL_LIBRARY = [
  {
    id: 'big-buck-bunny',
    title: 'Big Buck Bunny',
    subtitle: 'Blender Foundation · CC BY 3.0',
    kind: 'mp4',
    streamUrl: `${GS}/BigBuckBunny.mp4`,
  },
  {
    id: 'sintel',
    title: 'Sintel',
    subtitle: 'Blender Foundation · CC BY 3.0',
    kind: 'mp4',
    streamUrl: `${GS}/Sintel.mp4`,
  },
  {
    id: 'tears-of-steel',
    title: 'Tears of Steel',
    subtitle: 'Blender Foundation · CC BY 3.0',
    kind: 'mp4',
    streamUrl: `${GS}/TearsOfSteel.mp4`,
  },
  {
    id: 'elephants-dream',
    title: "Elephant's Dream",
    subtitle: 'Blender Foundation · CC BY 2.5',
    kind: 'mp4',
    streamUrl: `${GS}/ElephantsDream.mp4`,
  },
  {
    id: 'bbb-hls',
    title: 'Big Buck Bunny (HLS)',
    subtitle: 'Adaptive HLS test stream',
    kind: 'hls',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    id: 'apple-bipbop',
    title: 'Apple BipBop (HLS)',
    subtitle: 'Apple HLS reference stream',
    kind: 'hls',
    streamUrl:
      'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_adv_example_ts/master.m3u8',
  },
]

export const getLibraryItem = (id) => LEGAL_LIBRARY.find((x) => x.id === id) || null

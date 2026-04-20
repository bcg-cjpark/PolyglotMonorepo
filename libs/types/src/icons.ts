/**
 * 아이콘 이름 타입 정의
 * SVG 파일명과 일치해야 합니다.
 */
export type IconName =
  // 화살표 아이콘
  | 'arrow-forward'
  | 'arrow-backward'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-close'
  | 'arrow-open'
  | 'arrow-drawer'
  | 'arrow-right-thin'
  | 'arrow-updown'
  | 'arrow-updown-solid'
  | 'arrow-forward-sm'
  | 'arrow-backward-sm'
  | 'arrow-down-solid'
  | 'arrow-left-solid'
  | 'arrow-outward'
  | 'arrow-right-solid'
  | 'arrow-up-solid'
  | 'arrow-updown-solid'

  // 액션 아이콘
  | 'add-symbol'
  | 'heart'
  | 'heart-thin'
  | 'star'
  | 'plus'
  | 'minus'
  | 'plus-minus'
  | 'edit'
  | 'trash'
  | 'refresh'
  | 'search'
  | 'eye'
  | 'eye-close'
  | 'fullscreen'
  | 'external-link'
  | 'icn-delete'
  | 'copy'
  | 'download'
  | 'upload'
  | 'send'
  | 'pause'
  | 'move'
  | 'withdraw'
  | 'delete'
  | 'save'
  | 'sort'
  | 'grab'
  | 'drag-draw'

  // 네비게이션 아이콘
  | 'home'
  | 'settings'
  | 'person'
  | 'login'
  | 'logout'
  | 'mypage'
  | 'order'
  | 'trade'
  | 'support'
  | 'list'
  | 'phone'
  | 'notification'
  | 'campaign-thin'
  | 'deposit-thin'
  | 'faq-thin'
  | 'logout-thin'
  | 'mypage-thin'
  | 'support-thin'
  | 'trade-thin'
  | 'trash-thin'
  | 'info-thin'
  | 'close-thin'
  | 'list-thin'

  // 테마 아이콘
  | 'mode-dark'
  | 'mode-light'

  // 상태/알림 아이콘
  | 'warning'
  | 'warning2'
  | 'info'
  | 'check-sm'
  | 'check-circle'
  | 'grade'
  | 'fav'
  | 'favorite'

  // 화면/디스플레이 아이콘
  | 'screen-single'
  | 'screen-multi'
  | 'screen-multi2'
  | 'layout-1x1'
  | 'layout-2x2'
  | 'layout-3x3'
  | 'layout-4x4'

  // 차트 아이콘
  | 'chart'
  | 'chart-line'
  | 'chart-candle'
  | 'chart-bubble'
  | 'chart-area'
  | 'chart-5m'
  | 'chart-4h'
  | 'chart-1-w'
  | 'chart-1m'
  | 'chart-1h'
  | 'chart-1-d'
  | 'chart-15m'
  | 'chart-30m'
  | 'chart-indicator'
  | 'chart-new'
  | 'chart-setting'
  | 'chart-setup'
  | 'candle-redblue'
  | 'candle-greenred'

  // 기타 아이콘
  | 'asset'
  | 'calendar'
  | 'email'
  | 'time'
  | 'cert'
  | 'comm'
  | 'account-balance'
  | 'account'
  | 'description'
  | 'file-attached'
  | 'filter'
  | 'card'
  | 'close'
  | 'close small'
  | 'trending-up'
  | 'trending-down'
  | 'dollar'
  | 'cloud-upload'
  | 'transparent'
  | 'watch'
  | 'more vert'

  // 플래그 아이콘
  | 'flag-au'
  | 'flag-ca'
  | 'flag-cn'
  | 'flag-de'
  | 'flag-es'
  | 'flag-eu'
  | 'flag-fr'
  | 'flag-hk'
  | 'flag-it'
  | 'flag-jp'
  | 'flag-kr'
  | 'flag-mx'
  | 'flag-nl'
  | 'flag-nr'
  | 'flag-nz'
  | 'flag-se'
  | 'flag-sg'
  | 'flag-sui'
  | 'flag-tr'
  | 'flag-uk'
  | 'flag-us'
  | 'flag-za'

  // 알림 아이콘 (색상 유지)
  | 'notification-system'
  | 'notification-trade'
  | 'notification-event'
  | 'notification-security';

/**
 * 아이콘 타입 정의
 */
export type IconType = 'fill' | 'stroke';

/**
 * 아이콘 크기 타입
 */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * 아이콘 모양 타입 (스켈레톤용)
 */
export type IconVariant = 'circular' | 'square' | 'rounded';

/**
 * 아이콘 스켈레톤 Props
 */
export interface IconSkeletonProps {
  size?: IconSize;
  showText?: boolean;
  text?: string;
}

/**
 * 아이콘 크기 매핑
 */
export const ICON_SIZE_MAP: Record<IconSize, string> = {
  xs: '12px',
  sm: '16px',
  md: '24px',
  lg: '32px',
  xl: '48px',
};

/**
 * 아이콘 타입 매핑
 * 실제 SVG 파일 분석 결과를 바탕으로 각 아이콘의 기본 타입을 정의합니다.
 */
export const ICON_TYPES: Record<IconName, IconType> = {
  // 화살표 아이콘
  'arrow-forward': 'fill', // fill="currentColor"
  'arrow-backward': 'fill', // fill="currentColor"
  'arrow-up': 'stroke', // stroke="currentColor"
  'arrow-down': 'stroke', // stroke="currentColor"
  'arrow-close': 'fill', // fill="currentColor"
  'arrow-open': 'fill', // fill="currentColor"
  'arrow-drawer': 'fill', // fill="currentColor"
  'arrow-right-thin': 'stroke', // stroke="currentColor"
  'arrow-updown': 'stroke', // stroke="currentColor"
  'arrow-forward-sm': 'fill', // fill="currentColor"
  'arrow-backward-sm': 'fill', // fill="currentColor"
  'arrow-down-solid': 'fill', // fill="currentColor"
  'arrow-left-solid': 'fill', // fill="currentColor"
  'arrow-outward': 'fill', // fill="currentColor"
  'arrow-right-solid': 'fill', // fill="currentColor"
  'arrow-up-solid': 'fill', // fill="currentColor"
  'arrow-updown-solid': 'fill', // fill="currentColor"

  // 액션 아이콘
  'add-symbol': 'stroke', // stroke="currentColor"
  heart: 'fill', // fill="currentColor"
  'heart-thin': 'fill', // fill="currentColor"
  star: 'stroke', // stroke="currentColor"
  plus: 'fill', // fill="currentColor"
  minus: 'fill', // fill="currentColor"
  'plus-minus': 'stroke', // stroke="currentColor"
  edit: 'fill', // fill="currentColor"
  trash: 'fill', // fill="currentColor"
  refresh: 'fill', // fill="currentColor"
  search: 'fill', // fill="currentColor"
  eye: 'stroke', // stroke="currentColor"
  'eye-close': 'stroke', // stroke="currentColor"
  fullscreen: 'fill', // fill="currentColor"
  'external-link': 'fill', // fill="currentColor"
  'icn-delete': 'fill', // fill="currentColor"
  copy: 'fill', // fill="currentColor"
  download: 'fill', // fill="currentColor"
  upload: 'fill', // fill="currentColor"
  send: 'fill', // fill="currentColor"
  pause: 'fill', // fill="currentColor"
  move: 'fill', // fill="currentColor"
  withdraw: 'fill', // fill="currentColor"
  delete: 'fill', // fill="currentColor"
  save: 'stroke', // stroke="currentColor"
  sort: 'fill', // fill="currentColor"
  grab: 'fill', // fill="currentColor"
  'drag-draw': 'fill', // fill="currentColor"

  // 네비게이션 아이콘
  home: 'fill', // fill="currentColor"
  settings: 'fill', // fill="currentColor"
  person: 'fill', // fill="currentColor"
  login: 'fill', // fill="currentColor"
  logout: 'fill', // fill="currentColor"
  mypage: 'fill', // fill="currentColor"
  order: 'fill', // fill="currentColor"
  trade: 'stroke', // stroke="currentColor"
  support: 'fill', // fill="currentColor"
  list: 'fill', // fill="currentColor"
  phone: 'fill', // fill="currentColor"
  notification: 'fill', // fill="currentColor"
  'campaign-thin': 'stroke', // stroke="currentColor"
  'deposit-thin': 'stroke', // stroke="currentColor"
  'faq-thin': 'fill', // fill="currentColor"
  'logout-thin': 'fill', // fill="currentColor"
  'mypage-thin': 'stroke', // stroke="currentColor"
  'support-thin': 'fill', // fill="currentColor"
  'trade-thin': 'stroke', // stroke="currentColor"
  'trash-thin': 'stroke', // stroke="currentColor"
  'info-thin': 'fill', // fill="currentColor"
  'close-thin': 'fill', // fill="currentColor"
  'list-thin': 'stroke', // stroke="currentColor"

  // 테마 아이콘
  'mode-dark': 'fill', // fill="currentColor"
  'mode-light': 'fill', // fill="currentColor"

  // 상태/알림 아이콘
  warning: 'fill', // fill="currentColor"
  warning2: 'fill', // fill="currentColor"
  info: 'fill', // fill="currentColor"
  'check-sm': 'fill', // fill="currentColor"
  'check-circle': 'fill', // fill="currentColor"
  grade: 'fill', // fill="currentColor"
  fav: 'fill', // fill="currentColor"
  favorite: 'fill', // fill="currentColor"

  // 화면/디스플레이 아이콘
  'screen-single': 'fill', // fill="currentColor"
  'screen-multi': 'fill', // fill="currentColor"
  'screen-multi2': 'fill', // fill="currentColor"
  'layout-1x1': 'stroke', // stroke="currentColor"
  'layout-2x2': 'fill', // fill="currentColor"
  'layout-3x3': 'fill', // fill="currentColor"
  'layout-4x4': 'fill', // fill="currentColor"

  // 차트 아이콘
  chart: 'fill', // fill="currentColor"
  'chart-line': 'fill', // fill="currentColor"
  'chart-candle': 'fill', // fill="currentColor"
  'chart-bubble': 'fill', // fill="currentColor"
  'chart-area': 'fill', // fill="currentColor"
  'chart-5m': 'fill', // fill="currentColor"
  'chart-4h': 'fill', // fill="currentColor"
  'chart-1-w': 'fill', // fill="currentColor"
  'chart-1m': 'fill', // fill="currentColor"
  'chart-1h': 'fill', // fill="currentColor"
  'chart-1-d': 'fill', // fill="currentColor"
  'chart-15m': 'fill', // fill="currentColor"
  'chart-30m': 'fill', // fill="currentColor"
  'chart-indicator': 'stroke', // stroke="currentColor"
  'chart-new': 'stroke', // stroke="currentColor"
  'chart-setting': 'fill', // fill="currentColor"
  'chart-setup': 'stroke', // stroke="currentColor"
  'candle-redblue': 'fill', // 색상 유지 (trade 디렉터리)
  'candle-greenred': 'fill', // 색상 유지 (trade 디렉터리)

  // 기타 아이콘
  asset: 'fill', // fill="currentColor"
  calendar: 'fill', // fill="currentColor"
  email: 'fill', // fill="currentColor"
  time: 'fill', // fill="currentColor"
  cert: 'fill', // fill="currentColor"
  comm: 'fill', // fill="currentColor"
  'account-balance': 'fill', // fill="currentColor"
  account: 'fill', // fill="currentColor"
  description: 'fill', // fill="currentColor"
  'file-attached': 'fill', // fill="currentColor"
  filter: 'stroke', // stroke="currentColor"
  card: 'fill', // fill="currentColor"
  close: 'fill', // fill="currentColor"
  'close small': 'fill', // fill="currentColor"
  'trending-up': 'fill', // fill="currentColor"
  'trending-down': 'fill', // fill="currentColor"
  dollar: 'fill', // fill="currentColor"
  'cloud-upload': 'fill', // fill="currentColor"
  transparent: 'stroke', // stroke="currentColor"
  watch: 'fill', // fill="currentColor"
  'more vert': 'fill', // fill="currentColor"

  // 플래그 아이콘 (특별 처리)
  'flag-au': 'fill', // fill="currentColor"
  'flag-ca': 'fill', // fill="currentColor"
  'flag-cn': 'fill', // fill="currentColor"
  'flag-de': 'fill', // fill="currentColor"
  'flag-es': 'fill', // fill="currentColor"
  'flag-eu': 'fill', // fill="currentColor"
  'flag-fr': 'fill', // fill="currentColor"
  'flag-hk': 'fill', // fill="currentColor"
  'flag-it': 'fill', // fill="currentColor"
  'flag-jp': 'fill', // fill="currentColor"
  'flag-kr': 'fill', // fill="currentColor"
  'flag-mx': 'fill', // fill="currentColor"
  'flag-nl': 'fill', // fill="currentColor"
  'flag-nr': 'fill', // fill="currentColor"
  'flag-nz': 'fill', // fill="currentColor"
  'flag-se': 'fill', // fill="currentColor"
  'flag-sg': 'fill', // fill="currentColor"
  'flag-sui': 'fill', // fill="currentColor"
  'flag-tr': 'fill', // fill="currentColor"
  'flag-uk': 'fill', // fill="currentColor"
  'flag-us': 'fill', // fill="currentColor"
  'flag-za': 'fill', // fill="currentColor"

  // 알림 아이콘 (색상 유지)
  'notification-system': 'fill', // 색상 유지 (notification 디렉터리)
  'notification-trade': 'fill', // 색상 유지 (notification 디렉터리)
  'notification-event': 'fill', // 색상 유지 (notification 디렉터리)
  'notification-security': 'fill', // 색상 유지 (notification 디렉터리)
};

/**
 * 아이콘 타입을 자동으로 감지하는 함수
 */
export const getIconType = (name: IconName): IconType => {
  return ICON_TYPES[name] || 'fill'; // 기본값은 fill
};

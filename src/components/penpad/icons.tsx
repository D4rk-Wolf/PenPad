import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }

function ic(children: React.ReactNode) {
  return function Icon({ size = 16, strokeWidth = 1.5, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {children}
      </svg>
    )
  }
}

export const Icons = {
  Reports: ic(<><path d="M3.5 2.5h6L12.5 5.5v8a.5.5 0 0 1-.5.5h-8.5a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5z" /><path d="M9.5 2.5v3h3" /><path d="M5.5 8.5h5M5.5 10.5h3.5" /></>),
  Templates: ic(<><rect x="2.5" y="2.5" width="11" height="11" rx="1" /><path d="M2.5 5.5h11" /><path d="M5.5 5.5v8" /></>),
  Settings: ic(<><circle cx="8" cy="8" r="2" /><path d="M13.5 9.5l-1-.6a4.6 4.6 0 0 0 0-1.8l1-.6-1-1.7-1.1.4a4.6 4.6 0 0 0-1.6-.9L9.5 2.5h-2L7.2 3.8a4.6 4.6 0 0 0-1.6.9L4.5 4.3l-1 1.7 1 .6a4.6 4.6 0 0 0 0 1.8l-1 .6 1 1.7 1.1-.4a4.6 4.6 0 0 0 1.6.9l.3 1.3h2l.3-1.3a4.6 4.6 0 0 0 1.6-.9l1.1.4z" /></>),
  Search: ic(<><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5l3 3" /></>),
  Plus: ic(<><path d="M8 3v10M3 8h10" /></>),
  Check: ic(<path d="M3 8.5l3.5 3.5L13 4" />),
  ArrowRight: ic(<><path d="M3 8h10" /><path d="M9 4l4 4-4 4" /></>),
  ChevronRight: ic(<path d="M6 3l5 5-5 5" />),
  ChevronDown: ic(<path d="M3 6l5 5 5-5" />),
  Slash: ic(<path d="M11 3 5 13" />),
  Sun: ic(<><circle cx="8" cy="8" r="3" /><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" /></>),
  Moon: ic(<path d="M13 9.5A5.5 5.5 0 0 1 6.5 3 5.5 5.5 0 1 0 13 9.5z" />),
  Download: ic(<><path d="M8 2v8" /><path d="M4.5 7l3.5 3.5L11.5 7" /><path d="M3 13h10" /></>),
  Export: ic(<><path d="M8 10V2" /><path d="M4.5 5.5L8 2l3.5 3.5" /><path d="M3 13h10" /></>),
  Filter: ic(<><path d="M2 3h12l-4.5 5.5V13l-3 1.5V8.5z" /></>),
  Trash: ic(<><path d="M2.5 4.5h11" /><path d="M5.5 4.5v-2h5v2" /><path d="M3.5 4.5l1 9h7l1-9" /></>),
  More: ic(<><circle cx="3" cy="8" r="1" /><circle cx="8" cy="8" r="1" /><circle cx="13" cy="8" r="1" /></>),
  Lock: ic(<><rect x="3" y="7" width="10" height="7" rx="1" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></>),
  Shield: ic(<path d="M8 1.5l5.5 2v4.5c0 3-2.5 5.5-5.5 6.5C5 13.5 2.5 11 2.5 8V3.5z" />),
  Terminal: ic(<><rect x="1.5" y="2.5" width="13" height="11" rx="1" /><path d="M4 6l2 2-2 2" /><path d="M8 10h4" /></>),
  Book: ic(<><path d="M3 2.5h4a2 2 0 0 1 2 2v9a1.5 1.5 0 0 0-1.5-1.5H3z" /><path d="M13 2.5h-4a2 2 0 0 0-2 2v9a1.5 1.5 0 0 1 1.5-1.5H13z" /></>),
  Sparkle: ic(<><path d="M8 1v4M8 11v4M1 8h4M11 8h4M3.5 3.5l2.5 2.5M10 10l2.5 2.5M3.5 12.5l2.5-2.5M10 6l2.5-2.5" strokeWidth={1.2}/></>),
  Stack: ic(<><path d="M8 1.5l6 3-6 3-6-3z" /><path d="M2 8l6 3 6-3" /><path d="M2 11l6 3 6-3" /></>),
  Eye: ic(<><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" /><circle cx="8" cy="8" r="2" /></>),
  Calendar: ic(<><rect x="2" y="3" width="12" height="11" rx="1" /><path d="M2 6h12" /><path d="M5 2v3M11 2v3" /></>),
  User: ic(<><circle cx="8" cy="6" r="3" /><path d="M2.5 13.5a5.5 5.5 0 0 1 11 0" /></>),
  Logout: ic(<><path d="M9 2.5H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h5" /><path d="M11 5.5L14 8l-3 2.5" /><path d="M14 8H6" /></>),
  Globe: ic(<><circle cx="8" cy="8" r="6" /><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" /></>),
  Branch: ic(<><circle cx="4" cy="3" r="1.5" /><circle cx="4" cy="13" r="1.5" /><circle cx="12" cy="6" r="1.5" /><path d="M4 4.5v7" /><path d="M4 7c0 2 2 3 5 3.5" /></>),
  Bell: ic(<><path d="M3.5 11.5h9l-1-1.5v-3a3.5 3.5 0 0 0-7 0v3z" /><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" /></>),
  Bug: ic(<><rect x="4" y="5" width="8" height="8" rx="3" /><path d="M2 7l2 1M14 7l-2 1M2 11l2-0.5M14 11l-2-0.5M2 14l2-1M14 14l-2-1M5 5l1-1.5M11 5l-1-1.5" strokeWidth={1.2}/></>),
  Database: ic(<><ellipse cx="8" cy="3.5" rx="5.5" ry="1.5" /><path d="M2.5 3.5v9c0 .8 2.5 1.5 5.5 1.5s5.5-.7 5.5-1.5v-9" /><path d="M2.5 8c0 .8 2.5 1.5 5.5 1.5s5.5-.7 5.5-1.5" /></>),
  X: ic(<><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></>),
  Menu: ic(<><path d="M2.5 4h11M2.5 8h11M2.5 12h11" /></>),
  Sliders: ic(<><path d="M2.5 4h11M2.5 8h11M2.5 12h11" /><circle cx="6" cy="4" r="1.5" fill="currentColor" /><circle cx="10" cy="8" r="1.5" fill="currentColor" /><circle cx="4" cy="12" r="1.5" fill="currentColor" /></>),
  CheckCircle: ic(<><circle cx="8" cy="8" r="6" /><path d="M5.5 8l2 2 3-4" /></>),
  AlertTriangle: ic(<><path d="M8 2.5L14 13H2z" /><path d="M8 6v3M8 11v.5" /></>),
  Info: ic(<><circle cx="8" cy="8" r="6" /><path d="M8 7v4M8 5v.5" /></>),
  Copy: ic(<><rect x="5" y="5" width="8" height="9" rx="1" /><path d="M11 5V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1" /></>),
  ArrowUpRight: ic(<><path d="M5 11l6-6M6 5h5v5" /></>),
  HelpCircle: ic(<><circle cx="8" cy="8" r="6" /><path d="M6.5 6.5a1.5 1.5 0 0 1 2.92.5c0 1-1.42 1.5-1.42 2.5" /><circle cx="8" cy="12" r=".5" fill="currentColor" /></>),
  GitHub: ({ size = 16, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  ),
} as const

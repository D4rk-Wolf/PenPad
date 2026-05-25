import Link from 'next/link'
import { Shield, FileText, BookOpen } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-blue-50/40 flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-bold tracking-tight">PenPad</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>Sign in</Link>
            <Link href="/signup" className={cn(buttonVariants({ size: 'sm' }))}>Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted border border-border rounded-full px-3 py-1 mb-6">
          Free to start · No card required
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight max-w-2xl mb-4">
          Pen test reports that{' '}
          <span className="text-primary">look like you wrote them</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mb-8">
          Write findings, score vulnerabilities, and export client-ready PDF reports — without fighting a word processor.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }))}>Start for free</Link>
          <a href="#pricing" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}>See pricing →</a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16 w-full">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-10">Everything you need to ship reports faster</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'CVSS Scoring', desc: 'Score findings with CVSS v3.1. Severity calculated automatically.' },
            { icon: FileText, title: 'Professional PDFs', desc: 'Export client-ready reports with cover page, risk overview, and findings.' },
            { icon: BookOpen, title: 'Finding Templates', desc: 'Build a reusable library of common findings. Fill in the blanks.' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border border-border shadow-none">
              <CardHeader className="pb-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-16 w-full">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-10">Simple pricing</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card className="border border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Free</CardTitle>
              <div className="text-3xl font-extrabold tracking-tight">£0</div>
              <p className="text-sm text-muted-foreground">Up to 3 reports, 10 findings each</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">✓ PDF export</p>
              <p className="text-sm text-muted-foreground">✓ CVSS scoring</p>
              <Link href="/signup" className={cn(buttonVariants({ variant: 'outline' }), 'w-full mt-4')}>Get started</Link>
            </CardContent>
          </Card>
          <Card className="border border-primary/50 shadow-sm">
            <CardHeader>
              <div className="text-xs font-semibold text-primary mb-1">Most popular</div>
              <CardTitle className="text-sm font-semibold">Pro</CardTitle>
              <div className="text-3xl font-extrabold tracking-tight">£49<span className="text-base font-medium text-muted-foreground">/mo</span></div>
              <p className="text-sm text-muted-foreground">Unlimited reports and findings</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">✓ Everything in Free</p>
              <p className="text-sm text-muted-foreground">✓ Finding templates</p>
              <p className="text-sm text-muted-foreground">✓ Priority support</p>
              <Link href="/signup" className={cn(buttonVariants(), 'w-full mt-4')}>Start free trial</Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        PenPad by D4rkWolf Studios
      </footer>
    </div>
  )
}

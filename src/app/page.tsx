import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <span className="font-semibold text-lg">PenPad</span>
          <nav className="flex items-center gap-4">
            <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              Sign in
            </Link>
            <Link href="/signup" className={cn(buttonVariants({ size: 'sm' }))}>
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-24 text-center">
          <Badge variant="secondary" className="mb-4">Free to start</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
            Professional pen test reports<br />in minutes, not hours
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Log findings, score with CVSS, and export a client-ready PDF report.
            Stop wrestling with Word templates.
          </p>
          <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }))}>
            Start for free
          </Link>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'CVSS Scoring',
                body: 'Input a CVSS score and severity is calculated automatically — Critical, High, Medium, Low, or Info.',
              },
              {
                title: 'Professional PDFs',
                body: 'One click generates a structured report: cover page, executive summary, and per-finding technical detail.',
              },
              {
                title: 'Built for speed',
                body: 'Log findings as you work. No complex setup, no learning curve. Focus on the engagement, not the paperwork.',
              },
            ].map((f) => (
              <Card key={f.title}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t">
          <div className="container mx-auto px-4 py-24">
            <h2 className="text-3xl font-bold text-center mb-12">Simple pricing</h2>
            <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <p className="font-semibold text-lg mb-1">Free</p>
                  <p className="text-3xl font-bold mb-4">£0</p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li>3 reports</li>
                    <li>Unlimited findings</li>
                    <li>CVSS scoring</li>
                    <li className="line-through">PDF export</li>
                  </ul>
                  <Link href="/signup" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
                    Get started
                  </Link>
                </CardContent>
              </Card>
              <Card className="border-primary">
                <CardContent className="pt-6">
                  <p className="font-semibold text-lg mb-1">Pro</p>
                  <p className="text-3xl font-bold mb-4">
                    £49<span className="text-base font-normal text-muted-foreground">/mo</span>
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li>Unlimited reports</li>
                    <li>Unlimited findings</li>
                    <li>CVSS scoring</li>
                    <li>PDF export</li>
                  </ul>
                  <Link href="/signup" className={cn(buttonVariants(), 'w-full')}>
                    Start free, upgrade when ready
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          PenPad by D4rkWolf Studios
        </div>
      </footer>
    </div>
  )
}

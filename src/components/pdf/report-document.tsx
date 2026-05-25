// src/components/pdf/report-document.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Report, Finding } from '@/lib/db/schema'
import type { Severity } from '@/lib/utils'

const BRAND_BLUE = '#1d4ed8'
const BRAND_BLUE_MID = '#2563eb'

const SEVERITY_HEX: Record<string, string> = {
  critical: '#dc2626',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#3b82f6',
  info:     '#94a3b8',
}

const SEVERITY_BG_HEX: Record<string, string> = {
  critical: '#fee2e2',
  high:     '#fff7ed',
  medium:   '#fefce8',
  low:      '#eff6ff',
  info:     '#f8fafc',
}

const SEVERITY_TEXT_HEX: Record<string, string> = {
  critical: '#991b1b',
  high:     '#9a3412',
  medium:   '#854d0e',
  low:      '#1d4ed8',
  info:     '#64748b',
}

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

function makeClientCode(name: string): string {
  const code = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4)
  return code || 'RPRT'
}

function countBySeverity(findings: Finding[]) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
  for (const f of findings) {
    const s = (f.severity ?? 'info') as Severity
    counts[s]++
  }
  return counts
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return 'N/A'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const styles = StyleSheet.create({
  // Cover page
  coverPage: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#0f172a',
    paddingBottom: 36,
  },
  coverHeaderBand: {
    backgroundColor: BRAND_BLUE,
    paddingHorizontal: 28,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coverHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  coverWordmark: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  coverHeaderRight: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.2,
  },
  coverBody: {
    paddingHorizontal: 40,
    paddingTop: 48,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  eyebrowRule: {
    width: 28,
    height: 1,
    backgroundColor: BRAND_BLUE,
    marginRight: 10,
  },
  eyebrowLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    letterSpacing: 1.4,
  },
  coverTitle: {
    fontSize: 30,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  coverClient: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE_MID,
    marginBottom: 22,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 22,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 28,
  },
  metaCell: {
    width: '50%',
    marginBottom: 16,
    paddingRight: 16,
  },
  metaLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 11,
    color: '#0f172a',
    fontFamily: 'Helvetica-Bold',
  },
  riskHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  riskRow: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  riskCell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginRight: 6,
    alignItems: 'center',
  },
  riskCellLast: {
    marginRight: 0,
  },
  riskCount: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  riskLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.1,
  },
  confBanner: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  confBannerText: {
    fontSize: 9,
    color: '#854d0e',
    fontFamily: 'Helvetica-Bold',
  },
  coverFooter: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#94a3b8',
  },

  // Findings pages
  findingsPage: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#0f172a',
    paddingTop: 44,
    paddingBottom: 36,
    paddingHorizontal: 28,
  },
  runningHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: BRAND_BLUE,
    paddingHorizontal: 28,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  runningHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  runningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_BLUE,
    marginRight: 6,
  },
  runningWordmark: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
    letterSpacing: 0.8,
  },
  runningHeaderRight: {
    fontSize: 8,
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
  },
  runningFooter: {
    position: 'absolute',
    bottom: 14,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#94a3b8',
  },
  runningFooterCentre: {
    fontSize: 8,
    color: '#94a3b8',
  },
  findingsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
    marginBottom: 14,
  },
  findingsHeadingCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BRAND_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  findingsHeadingCircleText: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
  },
  findingsHeadingLabel: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  findingBlock: {
    borderLeftWidth: 4,
    borderLeftColor: '#94a3b8',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  findingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  findingHeaderLeft: {
    flex: 1,
    paddingRight: 10,
  },
  findingId: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 2,
  },
  findingTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  findingHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    letterSpacing: 0.8,
    marginRight: 8,
  },
  cvssLabel: {
    fontSize: 9,
    color: '#475569',
    fontFamily: 'Helvetica-Bold',
  },
  fieldLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 3,
    marginTop: 6,
  },
  fieldValue: {
    fontSize: 10,
    color: '#0f172a',
    lineHeight: 1.45,
  },
  evidenceValue: {
    fontFamily: 'Courier',
    fontSize: 8,
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    padding: 8,
    borderRadius: 3,
    lineHeight: 1.4,
  },
})

const riskCells = [
  { key: 'critical', label: 'Critical', bg: '#fff1f2', border: '#fecdd3', color: '#be123c' },
  { key: 'high',     label: 'High',     bg: '#fff7ed', border: '#fed7aa', color: '#c2410c' },
  { key: 'medium',   label: 'Medium',   bg: '#fefce8', border: '#fde68a', color: '#92400e' },
  { key: 'low',      label: 'Low',      bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
  { key: 'info',     label: 'Info',     bg: '#f8fafc', border: '#e2e8f0', color: '#64748b' },
]

function CoverPage({ report, findings }: { report: Report; findings: Finding[] }) {
  const counts = countBySeverity(findings)
  const period =
    report.startDate || report.endDate
      ? `${fmtDate(report.startDate)} – ${fmtDate(report.endDate)}`
      : 'N/A'

  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverHeaderBand}>
        <View style={styles.coverHeaderLeft}>
          <View style={styles.coverDot} />
          <Text style={styles.coverWordmark}>PENPAD</Text>
        </View>
        <Text style={styles.coverHeaderRight}>
          PENETRATION TEST REPORT / SECURITY ASSESSMENT
        </Text>
      </View>

      <View style={styles.coverBody}>
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowRule} />
          <Text style={styles.eyebrowLabel}>SECURITY ASSESSMENT REPORT</Text>
        </View>

        <Text style={styles.coverTitle}>Penetration Test Report</Text>
        <Text style={styles.coverClient}>{report.clientName}</Text>

        <View style={styles.divider} />

        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>ASSESSMENT PERIOD</Text>
            <Text style={styles.metaValue}>{period}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>PREPARED BY</Text>
            <Text style={styles.metaValue}>{report.testerName || 'N/A'}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>CLASSIFICATION</Text>
            <Text style={styles.metaValue}>Confidential</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>TOTAL FINDINGS</Text>
            <Text style={styles.metaValue}>{findings.length}</Text>
          </View>
        </View>

        <Text style={styles.riskHeading}>RISK OVERVIEW</Text>
        <View style={styles.riskRow}>
          {riskCells.map((cell, idx) => (
            <View
              key={cell.key}
              style={[
                styles.riskCell,
                {
                  backgroundColor: cell.bg,
                  borderColor: cell.border,
                },
                idx === riskCells.length - 1 ? styles.riskCellLast : {},
              ]}
            >
              <Text style={[styles.riskCount, { color: cell.color }]}>
                {counts[cell.key as Severity]}
              </Text>
              <Text style={[styles.riskLabel, { color: cell.color }]}>
                {cell.label.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.confBanner}>
          <Text style={styles.confBannerText}>
            {'⚠  Confidential — For authorised recipients only'}
          </Text>
        </View>
      </View>

      <View style={styles.coverFooter} fixed>
        <Text>Generated by PenPad · penpad.io</Text>
        <Text>Page 1</Text>
      </View>
    </Page>
  )
}

function FindingsPages({
  report,
  findings,
  sorted,
}: {
  report: Report
  findings: Finding[]
  sorted: Finding[]
}) {
  if (sorted.length === 0) {
    return null
  }

  const clientCode = makeClientCode(report.clientName)
  // Suppress unused-var warning while keeping API consistent
  void findings

  return (
    <Page size="A4" style={styles.findingsPage}>
      <View style={styles.runningHeader} fixed>
        <View style={styles.runningHeaderLeft}>
          <View style={styles.runningDot} />
          <Text style={styles.runningWordmark}>PenPad</Text>
        </View>
        <Text style={styles.runningHeaderRight}>
          {report.clientName} · CONFIDENTIAL
        </Text>
      </View>

      <View style={styles.runningFooter} fixed>
        <Text>PenPad</Text>
        <Text style={styles.runningFooterCentre}>{report.clientName}</Text>
        <Text
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} / ${totalPages}`
          }
        />
      </View>

      <View style={styles.findingsHeading}>
        <View style={styles.findingsHeadingCircle}>
          <Text style={styles.findingsHeadingCircleText}>F</Text>
        </View>
        <Text style={styles.findingsHeadingLabel}>Findings</Text>
      </View>

      {sorted.map((finding, index) => {
        const severity = (finding.severity ?? 'info') as Severity
        const findingId = `${clientCode}-${String(index + 1).padStart(3, '0')}`
        const cvss =
          finding.cvssScore !== null && finding.cvssScore !== undefined
            ? Number(finding.cvssScore).toFixed(1)
            : 'N/A'

        return (
          <View
            key={finding.id}
            wrap={false}
            style={[
              styles.findingBlock,
              { borderLeftColor: SEVERITY_HEX[severity] },
            ]}
          >
            <View style={styles.findingHeaderRow}>
              <View style={styles.findingHeaderLeft}>
                <Text style={styles.findingId}>{findingId}</Text>
                <Text style={styles.findingTitle}>{finding.title}</Text>
              </View>
              <View style={styles.findingHeaderRight}>
                <Text
                  style={[
                    styles.severityBadge,
                    {
                      backgroundColor: SEVERITY_BG_HEX[severity],
                      color: SEVERITY_TEXT_HEX[severity],
                    },
                  ]}
                >
                  {severity.toUpperCase()}
                </Text>
                <Text style={styles.cvssLabel}>CVSS {cvss}</Text>
              </View>
            </View>

            {finding.affectedComponent ? (
              <>
                <Text style={styles.fieldLabel}>AFFECTED COMPONENT</Text>
                <Text style={styles.fieldValue}>{finding.affectedComponent}</Text>
              </>
            ) : null}

            {finding.description ? (
              <>
                <Text style={styles.fieldLabel}>DESCRIPTION</Text>
                <Text style={styles.fieldValue}>{finding.description}</Text>
              </>
            ) : null}

            {finding.impact ? (
              <>
                <Text style={styles.fieldLabel}>IMPACT</Text>
                <Text style={styles.fieldValue}>{finding.impact}</Text>
              </>
            ) : null}

            {finding.recommendation ? (
              <>
                <Text style={styles.fieldLabel}>RECOMMENDATION</Text>
                <Text style={styles.fieldValue}>{finding.recommendation}</Text>
              </>
            ) : null}

            {finding.evidence ? (
              <>
                <Text style={styles.fieldLabel}>POC / EVIDENCE</Text>
                <Text style={styles.evidenceValue}>{finding.evidence}</Text>
              </>
            ) : null}
          </View>
        )
      })}
    </Page>
  )
}

export function ReportDocument({
  report,
  findings,
}: {
  report: Report
  findings: Finding[]
}) {
  const sorted = [...findings].sort((a, b) => {
    const sa = severityOrder[a.severity ?? 'info'] ?? 4
    const sb = severityOrder[b.severity ?? 'info'] ?? 4
    if (sa !== sb) return sa - sb
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  })

  return (
    <Document>
      <CoverPage report={report} findings={findings} />
      <FindingsPages report={report} findings={findings} sorted={sorted} />
    </Document>
  )
}

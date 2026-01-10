import React, { useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

type Step = {
  id: string;
  title: string;
  summary: string;
  actions: string[];
};

type Issue = {
  id: string;
  title: string;
  steps: string[];
};

const STEPS: Step[] = [
  {
    id: 'setup.identify-model',
    title: 'Identify model and variant',
    summary: 'Scan or enter the serial to auto-route the flow.',
    actions: [
      'Scan serial or enter manually',
      'Resolve model from serial mapping',
      'Confirm model badge',
    ],
  },
  {
    id: 'setup.unbox-assemble',
    title: 'Unbox and assemble',
    summary: 'Unbox, assemble, and position the kiosk.',
    actions: ['Confirm included items', 'Assemble per guide', 'Position near power'],
  },
  {
    id: 'setup.power-control-panel',
    title: 'Boot to Control Panel',
    summary: 'Power on and reach Control Panel.',
    actions: ['Power on using rear switch', 'Tap Evolt logo if login screen appears'],
  },
  {
    id: 'setup.connect-internet',
    title: 'Connect to internet',
    summary: 'Ethernet preferred, Wi-Fi fallback.',
    actions: [
      'Ethernet: plug in and refresh',
      'Wi-Fi: USB dongle -> Network -> Wi-Fi ON -> New Connection',
      'Confirm Online status is green',
    ],
  },
  {
    id: 'setup.software-update',
    title: 'Run software update',
    summary: 'Update system after connecting.',
    actions: ['Control Panel -> Software Update', 'Wait for reboot'],
  },
  {
    id: 'setup.operator-panel',
    title: 'Operator Panel login',
    summary: 'Use sticker login and set defaults.',
    actions: ['Login from back sticker', 'Set Kiosk Mode Unattended', 'Save'],
  },
  {
    id: 'setup.printer',
    title: 'Printer setup',
    summary: 'Connect and set default printer.',
    actions: ['Add printer', 'Select correct driver', 'Set Server Default'],
  },
  {
    id: 'setup.calibration',
    title: 'Scale check',
    summary: 'Calibrate for accurate readings.',
    actions: ['Control Panel -> Scale', 'Calibrate and Save', 'Test Weight Only'],
  },
  {
    id: 'setup.first-scan',
    title: 'First scan test',
    summary: 'Run and print a test scan.',
    actions: ['Start Scanning', 'Run test scan', 'Confirm print preview'],
  },
];

const ISSUES: Issue[] = [
  {
    id: 'issue.no-internet',
    title: 'Cannot connect to internet',
    steps: ['Control Panel -> Network', 'Check Ethernet or Wi-Fi', 'Confirm Online status'],
  },
  {
    id: 'issue.white-screen',
    title: 'White screen',
    steps: ['Restart kiosk', 'Reconnect internet', 'Run software update'],
  },
  {
    id: 'issue.no-new-connection',
    title: 'No New Connection option',
    steps: ['Check USB dongle', 'System -> Lock USB OFF', 'Power cycle'],
  },
  {
    id: 'issue.no-start-button',
    title: 'No Start Scanning button',
    steps: ['Power cycle', 'Check Scale API Ready', 'Login to Operator Panel'],
  },
  {
    id: 'issue.print-missing',
    title: 'No print button or preview',
    steps: ['Run software update', 'Check print mode', 'Verify default printer'],
  },
  {
    id: 'issue.print-misaligned',
    title: 'Prints misaligned',
    steps: ['Prefer wired USB', 'Delete and re-add printer', 'Adjust print position'],
  },
];

const CHATBOT = [
  {
    q: 'How do I connect the kiosk to Wi-Fi?',
    a: 'Insert the USB Wi-Fi dongle into USB port 1. In Control Panel select Network, turn Wi-Fi ON, tap New Connection, choose the network, enter the password, then press Refresh. Confirm Online status is green.',
  },
  {
    q: 'How do I run a software update?',
    a: 'From Control Panel, confirm Online status is green, then press Software Update. The update runs automatically and takes about 3-4 minutes, then the kiosk reboots.',
  },
  {
    q: 'Where do I find the Operator Panel login?',
    a: 'It is on the black sticker on the back of the scanner. If missing, contact support.',
  },
  {
    q: 'The scanner is stuck on a white screen. How do I fix it?',
    a: 'Restart the kiosk, reconnect to the internet, and run a software update. If the screen stays white, wait 10 minutes for recovery. Escalate to support if it does not recover.',
  },
  {
    q: 'What are the hardware variants?',
    a: 'SOM has a fan, LP3 is the newest manufactured in 2025, and LP1 is the other variant.',
  },
];

function parseYear(serial: string) {
  const match = serial.match(/^EV\\d{6}-(\\d{5,8})$/);
  if (!match) return null;
  const raw = match[1];
  return raw.slice(0, 4);
}

function resolveModel(serial: string) {
  const year = parseYear(serial);
  if (!year) return 'Unknown';
  if (year >= '2025') return 'LP3';
  if (year >= '2024') return 'LP1';
  return 'SOM';
}

function App() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [serial, setSerial] = useState('');
  const [model, setModel] = useState('Unknown');
  const [serialMessage, setSerialMessage] = useState(
    'Enter a serial to identify the model.',
  );
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [issueQuery, setIssueQuery] = useState('');
  const [openIssues, setOpenIssues] = useState<Set<string>>(new Set());
  const [chatInput, setChatInput] = useState('');
  const [chatAnswer, setChatAnswer] = useState('Ask a question to see an answer.');
  const typeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const issues = useMemo(() => {
    if (!issueQuery.trim()) return ISSUES;
    return ISSUES.filter(issue =>
      issue.title.toLowerCase().includes(issueQuery.toLowerCase()),
    );
  }, [issueQuery]);

  const progress = Math.round((completed.size / STEPS.length) * 100);

  const toggleStep = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleIssue = (id: string) => {
    setOpenIssues(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const typeAnswer = (text: string) => {
    if (typeTimer.current) {
      clearInterval(typeTimer.current);
    }
    setChatAnswer('');
    let index = 0;
    typeTimer.current = setInterval(() => {
      setChatAnswer(prev => prev + text.charAt(index));
      index += 1;
      if (index >= text.length) {
        if (typeTimer.current) clearInterval(typeTimer.current);
        typeTimer.current = null;
      }
    }, 18);
  };

  const handleAsk = () => {
    if (!chatInput.trim()) {
      setChatAnswer('Ask a question to see an answer.');
      return;
    }
    const query = chatInput.toLowerCase();
    let best = CHATBOT[0];
    let bestScore = 0;
    CHATBOT.forEach(item => {
      const haystack = (item.q + ' ' + item.a).toLowerCase();
      let score = 0;
      query.split(' ').forEach(word => {
        if (word.length > 2 && haystack.includes(word)) score += 1;
      });
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    });
    typeAnswer(best.a);
  };

  const handleScan = () => {
    const detected = resolveModel(serial.trim());
    if (detected === 'Unknown') {
      setSerialMessage(
        'Model not recognized. Check the serial format it should EV001693-20230.',
      );
      setModel('Unknown');
      return;
    }
    setModel(detected);
    setSerialMessage(`Model detected: ${detected}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.app, !isWide && styles.appStacked]}>
        <View style={[styles.sidebar, !isWide && styles.sidebarStacked]}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>EV</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>Evolt Scan</Text>
              <Text style={styles.brandSub}>
                Live visibility for deployed scanners worldwide.
              </Text>
            </View>
          </View>
          <View style={styles.sidebarNote}>
            <Text style={styles.sidebarNoteText}>
              Guided setup, troubleshooting, and chatbot support are all in the main
              panel.
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled">
          <View style={[styles.hero, isWide ? styles.heroRow : styles.heroColumn]}>
            <View style={styles.heroLeft}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Evolt 360 Interactive Guide</Text>
              </View>
              <Text style={styles.welcome}>Welcome to Evolt</Text>
              <Text style={styles.heroTitle}>
                Scan. Configure. Fix.{' '}
                <Text style={styles.heroAccent}>All in one guided flow.</Text>
              </Text>
              <Text style={styles.heroCopy}>
                Serial-driven setup and troubleshooting for SOM, LP1, and LP3. Built
                to replace PDFs with step-by-step confidence.
              </Text>

              <View style={styles.serialBox}>
                <Text style={styles.label}>Serial number</Text>
                <View style={[styles.serialRow, !isWide && styles.serialRowStacked]}>
                  <TextInput
                    value={serial}
                    onChangeText={setSerial}
                    placeholder="EV001693-20230"
                    placeholderTextColor="#7b8794"
                    style={styles.input}
                    autoCapitalize="characters"
                  />
                  <Pressable
                    style={[styles.button, !isWide && styles.buttonFull]}
                    onPress={handleScan}>
                    <Text style={styles.buttonText}>Scan</Text>
                  </Pressable>
                </View>
                <Text style={styles.serialResult}>{serialMessage}</Text>
              </View>
            </View>

            <View style={styles.heroRight}>
              <View style={styles.heroImage}>
                <Image
                  source={require('./assets/team.png')}
                  style={styles.heroImageInner}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.heroCard}>
                <Text style={styles.heroCardTitle}>Setup Status</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{progress}% complete</Text>
                <View style={styles.statGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Model</Text>
                    <Text style={styles.statValue}>{model}</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Steps</Text>
                    <Text style={styles.statValue}>{STEPS.length}</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Offline</Text>
                    <Text style={styles.statValue}>Ready</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guided Setup</Text>
            <Text style={styles.sectionSub}>
              Follow the steps in order. Each step is tailored to the model.
            </Text>
            <View style={styles.cardGrid}>
              {STEPS.map(step => {
                const isChecked = completed.has(step.id);
                return (
                  <Pressable
                    key={step.id}
                    style={[
                      styles.card,
                      isChecked && styles.cardActive,
                      { width: isWide ? 260 : '100%' },
                    ]}
                    onPress={() => toggleStep(step.id)}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked ? <Text style={styles.checkboxMark}>✓</Text> : null}
                      </View>
                      <Text style={styles.cardTitle}>{step.title}</Text>
                    </View>
                    <Text style={styles.cardCopy}>{step.summary}</Text>
                    <Text style={styles.cardCopyMuted}>
                      {step.actions.join(' | ')}
                    </Text>
                    <View style={styles.tagRow}>
                      <Text style={styles.tag}>{model}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Troubleshooting</Text>
            <Text style={styles.sectionSub}>
              Search symptoms and get a direct fix. Tap a card to expand details.
            </Text>
            <View style={[styles.searchRow, !isWide && styles.searchRowStacked]}>
              <TextInput
                value={issueQuery}
                onChangeText={setIssueQuery}
                placeholder="white screen, no print, offline"
                placeholderTextColor="#7b8794"
                style={styles.input}
              />
            </View>
            <View style={styles.cardGrid}>
              {issues.map(issue => {
                const isOpen = openIssues.has(issue.id);
                return (
                  <Pressable
                    key={issue.id}
                    style={[
                      styles.card,
                      isOpen && styles.cardActive,
                      { width: isWide ? 260 : '100%' },
                    ]}
                    onPress={() => toggleIssue(issue.id)}>
                    <Text style={styles.cardTitle}>{issue.title}</Text>
                    <Text style={styles.cardCopyMuted}>
                      {issue.steps.join(' | ')}
                    </Text>
                    {isOpen ? (
                      <Text style={styles.cardDetail}>
                        Fix: {issue.steps.join(' -> ')}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ask the Chatbot</Text>
            <Text style={styles.sectionSub}>
              Fast answers from the knowledge base dataset.
            </Text>
            <View style={[styles.searchRow, !isWide && styles.searchRowStacked]}>
              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="How do I connect to Wi-Fi?"
                placeholderTextColor="#7b8794"
                style={styles.input}
              />
              <Pressable
                style={[styles.button, !isWide && styles.buttonFull]}
                onPress={handleAsk}>
                <Text style={styles.buttonText}>Ask</Text>
              </Pressable>
            </View>
            <View style={styles.chatAnswer}>
              <Text style={styles.chatText}>{chatAnswer}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0b0d10',
  },
  app: {
    flex: 1,
    flexDirection: 'row',
  },
  appStacked: {
    flexDirection: 'column',
  },
  sidebar: {
    width: 300,
    backgroundColor: '#0d1014',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
    padding: 24,
    gap: 20,
  },
  sidebarStacked: {
    width: '100%',
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#6ee8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#101317',
    fontWeight: '700',
  },
  brandTitle: {
    color: '#f4f6f8',
    fontSize: 16,
    fontWeight: '600',
  },
  brandSub: {
    color: '#9aa3ad',
    fontSize: 12,
    marginTop: 4,
  },
  sidebarNote: {
    backgroundColor: '#15181c',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sidebarNoteText: {
    color: '#9aa3ad',
    fontSize: 13,
    lineHeight: 18,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 24,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroColumn: {
    flexDirection: 'column',
  },
  heroLeft: {
    flex: 1,
  },
  heroRight: {
    gap: 16,
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: 'rgba(110,232,255,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#6ee8ff',
    fontSize: 12,
    fontWeight: '600',
  },
  welcome: {
    marginTop: 12,
    color: '#6ee8ff',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1.6,
    fontSize: 12,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f4f6f8',
    marginTop: 10,
  },
  heroAccent: {
    color: '#6ee8ff',
  },
  heroCopy: {
    color: '#9aa3ad',
    marginTop: 12,
    lineHeight: 20,
  },
  serialBox: {
    marginTop: 16,
    backgroundColor: '#15181c',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  label: {
    color: '#9aa3ad',
    fontSize: 12,
  },
  serialRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  serialRowStacked: {
    flexDirection: 'column',
  },
  input: {
    flex: 1,
    backgroundColor: '#1b1f24',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f4f6f8',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  button: {
    backgroundColor: '#6ee8ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFull: {
    width: '100%',
  },
  buttonText: {
    color: '#0b0d10',
    fontWeight: '700',
  },
  serialResult: {
    marginTop: 10,
    color: '#9aa3ad',
  },
  heroImage: {
    width: 320,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(110,232,255,0.4)',
  },
  heroImageInner: {
    width: '100%',
    height: '100%',
  },
  heroCard: {
    backgroundColor: 'rgba(21,24,28,0.92)',
    borderRadius: 16,
    padding: 16,
    width: 280,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  heroCardTitle: {
    color: '#9aa3ad',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4de2a4',
  },
  progressText: {
    color: '#9aa3ad',
    fontSize: 12,
    marginTop: 8,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: '#0b0d10',
    borderRadius: 12,
    padding: 10,
    minWidth: 80,
  },
  statLabel: {
    color: '#9aa3ad',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    color: '#f4f6f8',
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    color: '#f4f6f8',
    fontSize: 22,
    fontWeight: '700',
  },
  sectionSub: {
    color: '#9aa3ad',
    marginTop: 6,
    marginBottom: 14,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    backgroundColor: '#15181c',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    width: 260,
  },
  cardActive: {
    borderColor: 'rgba(77,226,164,0.4)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    color: '#f4f6f8',
    fontWeight: '600',
  },
  cardCopy: {
    color: '#cbd5df',
    marginTop: 8,
  },
  cardCopyMuted: {
    color: '#9aa3ad',
    marginTop: 6,
    fontSize: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4de2a4',
    borderColor: '#4de2a4',
  },
  checkboxMark: {
    color: '#0b0d10',
    fontWeight: '700',
  },
  tagRow: {
    marginTop: 10,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(110,232,255,0.15)',
    color: '#6ee8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  searchRowStacked: {
    flexDirection: 'column',
  },
  cardDetail: {
    color: '#c7d0c8',
    marginTop: 10,
    fontSize: 12,
  },
  chatAnswer: {
    backgroundColor: '#15181c',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
  },
  chatText: {
    color: '#cbd5df',
    lineHeight: 20,
  },
});

export default App;

const fs = require('fs');
const path = require('path');

const voipPath = path.join(__dirname, '..', 'node_modules', 'discord-voip', 'dist', 'index.js');

if (!fs.existsSync(voipPath)) {
  console.log('[patch-voip]: discord-voip not found, skipping patch.');
  process.exit(0);
}

let voip = fs.readFileSync(voipPath, 'utf8');

// Idempotency check: only patch once
if (voip.includes('__DAVE_E2EE_FINAL_V8__')) {
  console.log('ℹ️ [patch-voip]: discord-voip DAVE E2EE patch is already applied (v8).');
  process.exit(0);
}

let modified = false;

// 1. Patch processCommit: prepare & execute session transition on native Rust Davey session
const targetCommit = `      this.session.processCommit(payload.subarray(2));
      if (transitionId === 0) {
        this.reinitializing = false;
        this.lastTransitionId = transitionId;
      } else {
        this.pendingTransitions.set(transitionId, this.protocolVersion);
      }`;

const replaceCommit = `      this.session.processCommit(payload.subarray(2));
      if (transitionId === 0) {
        this.reinitializing = false;
        this.lastTransitionId = transitionId;
        try {
          this.session.prepareTransition(0, this.protocolVersion);
          this.session.executeTransition(0);
        } catch (e) {}
      } else {
        this.pendingTransitions.set(transitionId, this.protocolVersion);
        try {
          this.session.prepareTransition(transitionId, this.protocolVersion);
        } catch (e) {}
      }`;

if (voip.includes(targetCommit)) {
  voip = voip.replace(targetCommit, replaceCommit);
  modified = true;
  console.log('✅ [patch-voip]: Patched processCommit.');
}

// 2. Patch processWelcome: prepare & execute session transition on native Rust Davey session
const targetWelcome = `      this.session.processWelcome(payload.subarray(2));
      if (transitionId === 0) {
        this.reinitializing = false;
        this.lastTransitionId = transitionId;
      } else {
        this.pendingTransitions.set(transitionId, this.protocolVersion);
      }`;

const replaceWelcome = `      this.session.processWelcome(payload.subarray(2));
      if (transitionId === 0) {
        this.reinitializing = false;
        this.lastTransitionId = transitionId;
        try {
          this.session.prepareTransition(0, this.protocolVersion);
          this.session.executeTransition(0);
        } catch (e) {}
      } else {
        this.pendingTransitions.set(transitionId, this.protocolVersion);
        try {
          this.session.prepareTransition(transitionId, this.protocolVersion);
        } catch (e) {}
      }`;

if (voip.includes(targetWelcome)) {
  voip = voip.replace(targetWelcome, replaceWelcome);
  modified = true;
  console.log('✅ [patch-voip]: Patched processWelcome.');
}

// 3. Patch prepareTransition on native Davey session
const targetPrep = `    this.pendingTransitions.set(data.transition_id, data.protocol_version);
    if (data.transition_id === 0) {`;

const replacePrep = `    this.pendingTransitions.set(data.transition_id, data.protocol_version);
    try {
      this.session?.prepareTransition(data.transition_id, data.protocol_version);
    } catch (e) {}
    if (data.transition_id === 0) {`;

if (voip.includes(targetPrep)) {
  voip = voip.replace(targetPrep, replacePrep);
  modified = true;
  console.log('✅ [patch-voip]: Patched prepareTransition.');
}

// 4. Patch executeTransition on native Davey session
const targetExec = `    this.pendingTransitions.delete(transitionId);
    return true;
  }`;

const replaceExec = `    try {
      this.session?.executeTransition(transitionId);
    } catch (e) {}
    this.pendingTransitions.delete(transitionId);
    return true;
  }`;

if (voip.includes(targetExec)) {
  voip = voip.replace(targetExec, replaceExec);
  modified = true;
  console.log('✅ [patch-voip]: Patched executeTransition.');
}

// 5. Patch encrypt: verify session.canEncrypt (not just session.ready) and wrap in try/catch to avoid killing audio scheduler
const targetEncrypt = `  encrypt(packet) {
    if (this.protocolVersion === 0 || !this.session?.ready || packet.equals(SILENCE_FRAME))
      return packet;
    return this.session.encryptOpus(packet);
  }`;

const replaceEncrypt = `  encrypt(packet) {
    if (this.protocolVersion === 0 || !this.session?.canEncrypt || packet.equals(SILENCE_FRAME))
      return packet;
    try {
      return this.session.encryptOpus(packet);
    } catch (e) {
      return packet;
    }
  }`;

if (voip.includes(targetEncrypt)) {
  voip = voip.replace(targetEncrypt, replaceEncrypt);
  modified = true;
  console.log('✅ [patch-voip]: Patched encrypt with canEncrypt check and try/catch fallback.');
}

// 6. Patch prepareNextAudioFrame: protect stepPrepare in try/catch so audio loop NEVER dies
const targetAudioLoop = `function prepareNextAudioFrame(players) {
  const nextPlayer = players.shift();
  if (!nextPlayer) {
    if (nextTime >= 0) {
      audioCycleInterval = setTimeout(
        () => audioCycleStep(),
        Math.max(nextTime - Date.now(), 1)
      );
    }
    return;
  }
  nextPlayer["_stepPrepare"]();
  setImmediate(() => prepareNextAudioFrame(players));
}`;

const replaceAudioLoop = `function prepareNextAudioFrame(players) {
  const nextPlayer = players.shift();
  if (!nextPlayer) {
    if (nextTime >= 0) {
      audioCycleInterval = setTimeout(
        () => audioCycleStep(),
        Math.max(nextTime - Date.now(), 1)
      );
    }
    return;
  }
  try {
    nextPlayer["_stepPrepare"]();
  } catch (err) {}
  setImmediate(() => prepareNextAudioFrame(players));
}`;

if (voip.includes(targetAudioLoop)) {
  voip = voip.replace(targetAudioLoop, replaceAudioLoop);
  modified = true;
  console.log('✅ [patch-voip]: Patched prepareNextAudioFrame resilience.');
}

if (modified) {
  voip = '/* __DAVE_E2EE_FINAL_V8__ */\n' + voip;
  fs.writeFileSync(voipPath, voip, 'utf8');
  console.log('🎉 [patch-voip]: Successfully applied all DAVE E2EE fixes to discord-voip!');
} else {
  console.log('ℹ️ [patch-voip]: No patches were modified.');
}

/**
 * KINDER — "Dá um geral"
 * Le o estado atual do Firestore, compara com o snapshot salvo da ultima
 * vez que rodou (snapshot-cadastros.json, fora do git) e mostra o que
 * mudou desde entao. No final, sobrescreve o snapshot com o estado atual.
 *
 * Uso: node geral.js
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('./serviceAccount.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const SNAPSHOT_PATH = path.join(__dirname, 'snapshot-cadastros.json');

function perfilIncompletoCuidadora(p) {
  p = p || {};
  return !p.cidade || !(p.experiencia && p.experiencia.length);
}
function perfilIncompletoFamilia(p) {
  p = p || {};
  return !p.cidade || !p.rotina || !(p.condicao && p.condicao.length);
}
function documentosIncompletos(p) {
  p = p || {};
  var ds = p.docStatus || {};
  return !p.docFrenteUrl || !p.docVersoUrl || !p.antecedentesUrl ||
    ds.frente === 'vencido' || ds.verso === 'vencido' || ds.antecedentes === 'vencido';
}

async function main() {
  const [cSnap, fSnap] = await Promise.all([
    db.collection('cuidadores').get(),
    db.collection('familias').get()
  ]);

  const estadoAtual = {};

  cSnap.forEach(doc => {
    const d = doc.data();
    const p = d.perfil || {};
    estadoAtual[doc.id] = {
      tipo: 'cuidadora',
      nome: d.nome || doc.id,
      status: d.status || '(sem status)',
      perfilCompleto: !perfilIncompletoCuidadora(p),
      docsCompleto: !documentosIncompletos(p)
    };
  });
  fSnap.forEach(doc => {
    const d = doc.data();
    const p = d.perfil || {};
    estadoAtual[doc.id] = {
      tipo: 'familia',
      nome: d.nome || doc.id,
      status: d.status || '(sem status)',
      perfilCompleto: !perfilIncompletoFamilia(p),
      docsCompleto: true // familia nao tem doc
    };
  });

  console.log('\n🐺 KINDER — GERAL\n');

  // Contagens
  const contagem = { cuidadora: {}, familia: {} };
  Object.values(estadoAtual).forEach(item => {
    contagem[item.tipo][item.status] = (contagem[item.tipo][item.status] || 0) + 1;
  });
  console.log('== CUIDADORAS ==');
  console.log('Total:', cSnap.size);
  Object.entries(contagem.cuidadora).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('\n== FAMÍLIAS ==');
  console.log('Total:', fSnap.size);
  Object.entries(contagem.familia).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // Diff contra snapshot anterior
  if (fs.existsSync(SNAPSHOT_PATH)) {
    const anterior = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
    const estadoAnterior = anterior.estado || {};
    const quando = anterior.salvoEm ? new Date(anterior.salvoEm).toLocaleString('pt-BR') : '?';

    const novos = [];
    const mudouStatus = [];
    const completouPerfil = [];
    const completouDocs = [];

    Object.entries(estadoAtual).forEach(([uid, item]) => {
      const antes = estadoAnterior[uid];
      if (!antes) {
        novos.push(item);
        return;
      }
      if (antes.status !== item.status) mudouStatus.push({ ...item, statusAntes: antes.status });
      if (!antes.perfilCompleto && item.perfilCompleto) completouPerfil.push(item);
      if (!antes.docsCompleto && item.docsCompleto) completouDocs.push(item);
    });

    console.log(`\n== MUDANÇAS DESDE O ÚLTIMO GERAL (${quando}) ==`);
    console.log(`Novos cadastros: ${novos.length}`);
    if (mudouStatus.length) {
      console.log(`Mudaram de status (${mudouStatus.length}):`);
      mudouStatus.forEach(i => console.log(`  - ${i.nome} (${i.tipo}): ${i.statusAntes} → ${i.status}`));
    }
    if (completouPerfil.length) {
      console.log(`Completaram o perfil (${completouPerfil.length}):`);
      completouPerfil.forEach(i => console.log(`  - ${i.nome} (${i.tipo})`));
    }
    if (completouDocs.length) {
      console.log(`Completaram os documentos (${completouDocs.length}):`);
      completouDocs.forEach(i => console.log(`  - ${i.nome} (${i.tipo})`));
    }
    if (!mudouStatus.length && !completouPerfil.length && !completouDocs.length && !novos.length) {
      console.log('Nada mudou desde a última checagem.');
    }
  } else {
    console.log('\n(Primeira vez rodando — sem snapshot anterior pra comparar.)');
  }

  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify({ salvoEm: new Date().toISOString(), estado: estadoAtual }, null, 2));

  console.log('\n✅ Geral concluído. Snapshot salvo.');
  process.exit(0);
}

main().catch(e => { console.error('Erro:', e); process.exit(1); });

// Envio de email transacional via EmailJS, usando um unico template dinamico
// (template_4s63nga) — titulo/mensagem/botao variam por "tipo", o assunto
// do email tambem usa {{titulo}}. Ver [[project-kinder]] memoria pra contexto.
// Requer que a pagina ja tenha chamado emailjs.init(...) antes de usar isso.

var NOTIFICACOES = {
  cadastro_incompleto: function(dados) {
    return {
      titulo: 'Falta pouco para ativar seu perfil',
      mensagem: 'O Kinder está avançando e chegou a hora do próximo passo. Para analisar seu perfil e conectá-la(o) com famílias, acesse o aplicativo e complete seu cadastro com foto de perfil, documento com foto (RG, CPF ou CNH) e certidão de antecedentes criminais.',
      texto_botao: 'Completar cadastro'
    };
  }
};

window.enviarNotificacao = function(tipo, dados) {
  var cfg = NOTIFICACOES[tipo];
  if (!cfg) return Promise.reject(new Error('enviarNotificacao: tipo desconhecido — ' + tipo));
  var conteudo = cfg(dados || {});
  return emailjs.send('service_l99a8hr', 'template_4s63nga', {
    para_email: dados.email,
    nome: (dados.nome || '').split(' ')[0] || 'você',
    titulo: conteudo.titulo,
    mensagem: conteudo.mensagem,
    texto_botao: conteudo.texto_botao,
    link_botao: dados.link || 'https://kindercare.com.br/app/dashboard.html'
  });
};

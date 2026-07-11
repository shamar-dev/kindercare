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
  },
  cadastro_incompleto_familia: function(dados) {
    return {
      titulo: 'Falta pouco para explorar as cuidadoras',
      mensagem: 'Pra analisarmos seu cadastro e liberar o acesso às cuidadoras disponíveis, acesse o aplicativo e complete seu perfil com cidade, WhatsApp, rotina e as condições do seu familiar.',
      texto_botao: 'Completar cadastro'
    };
  },
  aprovado_explorar: function(dados) {
    return {
      titulo: 'Você já pode explorar cuidadoras no Kinder!',
      mensagem: 'Seu perfil foi aprovado! Agora você já pode acessar a plataforma e ver as cuidadoras disponíveis, entrar em contato e demonstrar interesse diretamente.',
      texto_botao: 'Explorar cuidadoras'
    };
  },
  aprovado_cuidadora: function(dados) {
    return {
      titulo: 'Seu perfil foi aprovado no Kinder!',
      mensagem: 'Parabéns! Seu cadastro foi aprovado e agora seu perfil já está visível pras famílias que buscam cuidadoras compatíveis com você. Fique de olho no seu painel — assim que uma família demonstrar interesse, você recebe uma mensagem por lá.',
      texto_botao: 'Ver meu perfil'
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

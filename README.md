# WEB - Geração de relatório

/reports

# O Client faz a requisição do relatório e essa requisição irá ser encaminhada para uma fila de processamento;

# Caso a geração do relatório falhar, o client deve ser avisado em tempo real e o relatório deve ser encaminhado para uma fila de reprocessamento;

# O Client pode solicitar o agendamento da entrega do relatório -> Data de entrega;

# Definição de prioridade na fila de processamento e recorrência - Cron Job;

# Utilizar o poder de processamento do GoLang para gerar múltiplos processos de geração de relatório em PDF a partir da fila de processamento;

# Notificações em tempo real;

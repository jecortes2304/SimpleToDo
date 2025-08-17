package mailer

import (
	"SimpleToDo/config"
	"github.com/go-mail/mail/v2"
)

type Mailer struct {
	host string
	port int
	user string
	pass string
	from string
}

func New() (*Mailer, error) {
	env := config.GetAppEnv()
	return &Mailer{
		host: env.SMTPHost,
		port: env.SMTPPort,
		user: env.SMTPUser,
		pass: env.SMTPPassword,
		from: env.SMTPFromEmail,
	}, nil
}

func (m *Mailer) Send(to, subject, text string) error {
	msg := mail.NewMessage()
	msg.SetHeader("From", m.from)
	msg.SetHeader("To", to)
	msg.SetHeader("Subject", subject)
	msg.SetBody("text/plain", text)

	d := mail.NewDialer(m.host, m.port, m.user, m.pass)
	return d.DialAndSend(msg)
}

func (m *Mailer) SendWithTemplate(to, subject, textTemplate string) error {
	msg := mail.NewMessage()
	msg.SetHeader("From", m.from)
	msg.SetHeader("To", to)
	msg.SetHeader("Subject", subject)
	msg.AddAlternative("text/html", textTemplate)

	d := mail.NewDialer(m.host, m.port, m.user, m.pass)
	return d.DialAndSend(msg)
}

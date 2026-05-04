import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.APP_PASSWORD,
    },
})

export const sendEmail = async (to: string, subject: string, html: string) => {
    // const mailOptions = {
    //     from: `Lottery App <${process.env.GMAIL_USER}>`,
    //     to,
    //     subject,
    //     html,
    // };

    const mailOptions = {
        from: `Lottery App <${process.env.GMAIL_USER}>`,
        to: "sanjaas880@gmail.com",
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}
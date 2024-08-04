const SEND_TX_PIN_RESET = (name: string, token: string) => `
    <div style="background-color: #f2f2f2; padding: 20px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px;">
            <div style="text-align: center;">
                <img src=
                "https:/
                /res.c
                loudinary
                .com/d
                q6hflqvy
                /image
                /upload
                /v159
                594000
                0/logo
                _1_1x
                _xqjz
                1y.png
                " alt="logo" style="width: 100px; height: 100px;">
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <h2 style="font-size: 20px; color: #000;">Hi ${name},</h2>
                <p style="font-size: 16px; color: #000;">You requested to reset your transaction pin. Click use the token below to reset your transaction pin.</p>
                <p style="font-size: 16px; color: #000;">Token: <strong>${token}</strong></p>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <p style="font-size: 16px; color: #000;">If you did not request to reset your transaction pin, please ignore this email.</p>
            </div>
        </div>
    </div>
    
`;

export default SEND_TX_PIN_RESET;

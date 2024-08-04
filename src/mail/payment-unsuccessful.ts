const PAYMENT_UNSUCCESSFUL = (
  name: string,
  users: { [key: string]: string }[]
) => `
  <div style="background-color: #f5f5f5; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px;">
      <div style="text-align: center;">
        <img src="https://res.cloudinary.com/renmoney/image/upload/v1593640009/renmoney-logo.png" alt="Sinnts Logo" style="width: 100px; height: 100px;"/>
        </div>
        <h2 style="text-align: center;">Payment Unsuccessful</h2>
        <p style="text-align: center;">Hi ${name},</p>
        <p style="text-align: center;">Oops!, we couldn't pay the following users below because their wallet is not setup yet. They will need to setup their wallet before you can make a payment to them.</p>
        <p style="text-align: center;">
          ${users.map((user) => `\n- <strong>${user.name}</strong>`).join('')}
        </p>
        <p style="text-align: center;">Please contact
            <a href="mailto:">
                <strong>support</strong>
            </a>
            for assistance.
        </p>
        <p style="text-align: center;">Thank you.</p>
    </div>
    </div>
          `;

export default PAYMENT_UNSUCCESSFUL;

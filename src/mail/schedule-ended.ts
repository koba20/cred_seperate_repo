const SCHEDULE_ENDED = (fullName: string, message: string) => `
  <div style="background-color: #f5f5f5; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px;">
      <div style="text-align: center;">
        <img src="https://res.cloudinary.com/renmoney/image/upload/v1593640009/renmoney-logo.png" alt="Renmoney Logo" style="width: 100px; height: 100px;"/>
        </div>
        <h2 style="text-align: center;">Schedule Ended</h2>
        <p style="text-align: center;">Hi ${fullName},</p>
        <p style="text-align: center;">${message}</p>
        <p style="text-align: center;">Please contact
            <a href="mailto:
            
            ">
            </a>
            for assistance.
            </p>
            <p style="text-align: center;">Thank you.</p>
            </div>
            </div>
            `;

export default SCHEDULE_ENDED;

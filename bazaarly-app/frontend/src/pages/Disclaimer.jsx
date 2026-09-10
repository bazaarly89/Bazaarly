import React, { useEffect, useState } from 'react';
import { Api } from '../api/client';

const DEFAULT_HEADING = 'Disclaimer';
const DEFAULT_BODY = `The content on Dostivox — including buying guides, comparisons, and recommendations — is provided for general informational purposes only. While we aim to be accurate and helpful, we make no guarantees about the completeness, reliability or timeliness of any information on this site.

Product prices, specifications and availability are set by third-party merchants and can change without notice. Dostivox is not responsible for pricing errors, stock issues, or order fulfillment — these are handled entirely by the merchant you purchase from.

Buying guides and "best of" recommendations reflect our editorial opinion at the time of writing and are not a substitute for your own research. Ratings and reviews shown, where present, come from the merchant's own listing data.

Use of this site is at your own discretion. We recommend verifying details on the merchant's site before completing any purchase.`;

export default function Disclaimer() {
  const [heading, setHeading] = useState(DEFAULT_HEADING);
  const [body, setBody] = useState(DEFAULT_BODY);

  useEffect(() => {
    Api.siteContent()
      .then(({ content }) => {
        if (content?.disclaimer_heading) setHeading(content.disclaimer_heading);
        if (content?.disclaimer_body) setBody(content.disclaimer_body);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="section-title">{heading}</h1>
        <div className="mt-6 space-y-4 text-slate-600 leading-relaxed">
          {body.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
        </div>
      </div>
    </div>
  );
}

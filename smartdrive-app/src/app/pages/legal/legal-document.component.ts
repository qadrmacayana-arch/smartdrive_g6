import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';

export type LegalDocumentType = 'terms' | 'privacy';

interface LegalSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

interface LegalDocument {
  title: string;
  introduction: string;
  notice: string;
  sections: LegalSection[];
}

const LAST_UPDATED = 'October 20, 2026';

const DOCUMENTS: Record<LegalDocumentType, LegalDocument> = {
  terms: {
    title: 'Terms of Use',
    introduction:
      'These terms explain the rules for using the SmartDrive website and app. By creating an account or using the service, you agree to these terms.',
    notice:
      'SmartDrive is a student project and prototype. These terms do not represent a claim that SmartDrive is a registered rental operator, that a vehicle is owned by SmartDrive, or that a displayed vehicle is available for hire.',
    sections: [
      {
        title: '1. Who may use SmartDrive',
        paragraphs: [
          'You must be legally able to enter into an agreement to use the service. A vehicle rental may have additional age, identity, driving licence, and eligibility requirements set by the vehicle owner or rental provider. Meeting the account requirements does not mean you are eligible to drive a particular vehicle.',
          'If you create an account, keep your sign-in details secure and provide accurate information. You are responsible for activity carried out through your account, except where applicable law provides otherwise.',
        ],
      },
      {
        title: '2. What the service provides',
        paragraphs: [
          'SmartDrive provides digital tools to browse vehicle listings, save favourites, plan trips, submit booking requests, view account information, and contact the team. Features and availability may change while this project is developed.',
          'A listing, date selection, price estimate, or submitted request is not by itself a confirmed rental. A booking is confirmed only when the app displays confirmation or the responsible rental provider separately confirms it.',
        ],
      },
      {
        title: '3. Rental terms and vehicle providers',
        paragraphs: [
          'The vehicle owner or rental provider is responsible for vehicle condition, handover, required documents, driver eligibility, deposits, insurance, mileage, fuel, late returns, and other vehicle-specific requirements. Review the final terms supplied for the particular booking before paying or accepting a vehicle.',
          'If a final rental agreement conflicts with a general description in the app, the specific agreement and any rights that cannot legally be waived will govern the rental. Ask the responsible provider to clarify any unclear requirement before payment or pickup.',
        ],
      },
      {
        title: '4. Prices, payment, and rewards',
        paragraphs: [
          'Review the final amount and payment method shown at checkout. Card, GCash, or Maya checkout is handled by PayMongo; SmartDrive does not ask you to send payment-card credentials in a message. A booking paid through a provider remains subject to that provider confirming the payment.',
          'SR Points and promotions are app features governed by the balance, eligibility, and terms shown when they are offered. Unless a specific offer says otherwise, points have no cash value and cannot be transferred or redeemed outside SmartDrive.',
          'Any deposit, cancellation charge, refund, or additional rental fee must be disclosed by the responsible rental provider or in the specific booking terms. Do not rely on estimates or general examples as a price quote.',
        ],
      },
      {
        title: '5. Cancellations and changes',
        paragraphs: [
          'Cancellation, rescheduling, refund, and no-show rules can differ by vehicle and provider. Check the terms shown for your booking and contact the provider or SmartDrive team promptly if you need to change or cancel a request.',
          'SmartDrive cannot promise a refund or waive a charge imposed under a valid provider agreement. Nothing in these terms limits consumer rights that applicable law does not allow a service to exclude.',
        ],
      },
      {
        title: '6. Acceptable use',
        paragraphs: [
          'Use the service lawfully and only for its intended purpose. Do not submit false information, misuse another person’s account, interfere with the service, probe or bypass security controls, upload harmful content, or use the app to infringe another person’s rights.',
          'Do not use a booking to evade a rental provider’s verification, driver, or vehicle-use requirements. You may not reproduce or misuse app content except as permitted by law or with the rights holder’s permission.',
        ],
      },
      {
        title: '7. Third-party services',
        paragraphs: [
          'The app may rely on third-party services, including Google sign-in, Supabase account and data services, and PayMongo checkout. Those providers operate under their own terms and privacy notices. Their availability and processing are not controlled by SmartDrive.',
        ],
      },
      {
        title: '8. Availability and disclaimers',
        paragraphs: [
          'The project is provided on an evolving, prototype basis. We work to keep information useful, but do not guarantee uninterrupted access, error-free operation, listing accuracy, vehicle availability, or a particular rental outcome.',
          'To the extent allowed by law, SmartDrive is not responsible for a vehicle owner’s conduct, vehicle condition, or rental performance. This does not exclude responsibility that cannot legally be excluded, including applicable consumer protections.',
        ],
      },
      {
        title: '9. Suspension and account closure',
        paragraphs: [
          'We may restrict access where reasonably necessary to protect users, investigate suspected misuse, maintain the service, or comply with law. You may stop using the service at any time. Account deletion requests are handled through the available account settings or by contacting the team; any records that must be retained by law or for a legitimate unresolved transaction may be retained as described in the Privacy Notice.',
        ],
      },
      {
        title: '10. Updates and governing rules',
        paragraphs: [
          'We may update these terms as the project changes. The latest version and its update date will be posted here. If a change materially affects users, we will provide notice through the app where reasonably practicable.',
          'These terms are intended for users in the Philippines and are subject to applicable Philippine law. Any dispute remains subject to mandatory consumer protections and the jurisdiction required by law.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Notice',
    introduction:
      'This notice describes the personal information the SmartDrive project handles through the app, why it is used, and the choices and rights available to you.',
    notice:
      'SmartDrive is a student project and prototype. The project team is identified here as the contact for this app; a separate registered legal operator, privacy officer, and business mailing address have not been provided for publication.',
    sections: [
      {
        title: '1. Information we handle',
        paragraphs: ['Depending on the features you use, the app may handle:'],
        bullets: [
          'Account details such as your name, email address, password authentication data, and information received from Google when you choose Google sign-in.',
          'Profile details you provide, including birthday, phone number, gender, and Philippine address or location selections.',
          'Booking and payment records such as the selected vehicle, dates, booking reference, amount, payment method, and payment status.',
          'Messages you send through the contact form, including your name, email, subject, and message.',
          'An optional profile photo. The app stores profile photos in a publicly readable avatar bucket; do not upload an image you expect to remain private.',
          'App preferences and limited working data stored on your device, such as saved favourites, notification preferences, remembered email (if selected), theme, and an in-progress booking draft.',
        ],
      },
      {
        title: '2. Information we do not request through this app',
        paragraphs: [
          'The app does not ask you to enter a driver’s licence number or upload identity documents in its profile form. Vehicle providers may need to inspect required documents separately before a rental.',
          'The app does not collect your precise device location through a location-permission feature. Do not include sensitive identity, health, or financial information in a support message.',
        ],
      },
      {
        title: '3. How information is used',
        paragraphs: ['Information is used to:'],
        bullets: [
          'Create and secure accounts, restore sign-in sessions, and complete Google authentication when selected.',
          'Maintain profiles and support vehicle browsing, booking requests, payment confirmation, rewards, and account settings.',
          'Respond to support messages, administer the service, detect misuse, troubleshoot errors, and protect users and the project.',
          'Send in-app or device notifications when you enable them and deliver service or booking-related communications.',
          'Meet legal obligations and address disputes or security incidents where applicable.',
        ],
      },
      {
        title: '4. Service providers and sharing',
        paragraphs: [
          'SmartDrive uses Supabase for authentication, database, and avatar storage; Google for Google sign-in; and PayMongo for external payment checkout. These providers process information as needed to supply their services and under their own terms and privacy notices.',
          'Authorized project administrators may access account, booking, payment-status, and support information to operate and troubleshoot the app. Information may be shared with a vehicle provider only when needed to respond to or arrange a booking, and applicable provider terms should be reviewed before confirming a rental.',
          'Information may also be disclosed when required by law or when reasonably necessary to protect users, the service, or legal rights. The app does not intentionally sell personal information.',
        ],
      },
      {
        title: '5. Payments',
        paragraphs: [
          'For card, GCash, and Maya payments, the app sends the checkout request to PayMongo and redirects you to its checkout. SmartDrive stores booking and payment references/statuses needed to reconcile a transaction; payment credentials are entered with the payment provider, not in the SmartDrive profile.',
        ],
      },
      {
        title: '6. Device storage and security',
        paragraphs: [
          'The app uses browser or device storage to keep authentication sessions and preferences working. Some data, such as a booking draft or selected preferences, may remain on the device until cleared or overwritten. Use a private device, sign out when finished, and avoid sharing a device that retains your session.',
          'We use access controls and the security features provided by our services, but no internet transmission or storage method can be guaranteed completely secure. Report suspected account exposure promptly using the contact below.',
        ],
      },
      {
        title: '7. International processing and retention',
        paragraphs: [
          'Supabase, Google, PayMongo, and their service providers may process information in locations outside the Philippines depending on their infrastructure and configuration. Applicable provider safeguards and terms govern that processing.',
          'The project has not published a fixed retention schedule. Information is kept only as long as needed for the purposes above, account and booking administration, security, or applicable legal obligations, then deleted or de-identified when reasonably practicable. Actual deletion may depend on provider backups and retention controls.',
        ],
      },
      {
        title: '8. Your choices and privacy rights',
        paragraphs: [
          'You can review or update profile details in Account Settings, control available notification preferences, remove the Google sign-in connection from your Google Account, and request access, correction, deletion, or other action regarding your personal information.',
          'To make a privacy request, email smartdriveteam@smartdrive.com from the address associated with your account and describe what you need. We may need to verify your identity before acting. We will respond within the period required by applicable law. Deletion may not remove records that must be retained for legal, security, or unresolved transaction reasons.',
          'These statements describe project procedures and do not limit rights available under the Philippine Data Privacy Act of 2012 and its implementing rules.',
        ],
      },
      {
        title: '9. Children',
        paragraphs: [
          'SmartDrive is not designed for children to create rental accounts. Do not create an account or submit personal information if you are not legally able to use the service. Vehicle providers may apply additional age requirements.',
        ],
      },
      {
        title: '10. Changes and contact',
        paragraphs: [
          'This notice may change as the project’s features and data practices change. The current version and update date will be posted here. For privacy questions or requests, contact the SmartDrive project team at smartdriveteam@smartdrive.com.',
        ],
      },
    ],
  },
};

@Component({
  selector: 'app-legal-document',
  standalone: true,
  imports: [IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './legal-document.component.html',
  styleUrl: './legal-document.component.scss',
})
export class LegalDocumentComponent {
  readonly type = input.required<LegalDocumentType>();
  readonly updatedOn = LAST_UPDATED;
  readonly document = computed(() => DOCUMENTS[this.type()]);
}

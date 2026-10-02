import { emailFooterHtml } from "../footer";

export function BusinessEmailFooter() {
  return <div dangerouslySetInnerHTML={{ __html: emailFooterHtml() }} />;
}

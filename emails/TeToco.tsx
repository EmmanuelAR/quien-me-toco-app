import { Button, Section, Text } from "@react-email/components";
import { BaseEmail, styles } from "./Base";

export interface TeTocoProps {
  appUrl: string;
  groupUrl: string;
  giverName: string;
  receiverName: string;
  groupName: string;
  when: string;
  place: string;
  budget: string;
}

/** el correo que le llega a cada participante con cuenta apenas se hace el sorteo */
export function TeToco({ appUrl, groupUrl, giverName, receiverName, groupName, when, place, budget }: TeTocoProps) {
  return (
    <BaseEmail preview={`${giverName}, ya sabemos quién te tocó. shh.`} appUrl={appUrl}>
      <Text style={styles.h1}>
        {giverName}, te tocó <span style={styles.marker("blue")}>{receiverName}</span>
      </Text>
      <Text style={styles.text}>shh, no le digás a nadie. en la app ves su wishlist, siempre actualizada.</Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={groupUrl} style={styles.button}>
          abrir la app
        </Button>
      </Section>
      <Text style={styles.soft}>
        <span style={styles.marker("pink")}>{groupName}</span>
      </Text>
      <Text style={styles.soft}>cuándo: {when}</Text>
      {place && <Text style={styles.soft}>dónde: {place}</Text>}
      <Text style={styles.soft}>presupuesto: {budget}</Text>
      <Text style={{ ...styles.soft, marginTop: "16px" }}>
        va adjunto el evento para tu calendario. el día del intercambio quien organiza destapa todo en la app.
      </Text>
    </BaseEmail>
  );
}

export default TeToco;

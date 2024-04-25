import { Card } from "react-bootstrap";

const Wpx = ({wpx} ) => {
    return (

        <Card>
            <Card.Header>WPX</Card.Header>
            <Card.Body>
                <Card.Title>WPX</Card.Title>
                <Card.Text>
                    <blockquote>
                        {wpx}
                    </blockquote>
                </Card.Text>
            </Card.Body>
            <Card.Footer>
            </Card.Footer>
        </Card>
    );
};
export default Wpx;

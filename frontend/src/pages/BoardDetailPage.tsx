import React from 'react';
import { Container, Card, Button, ListGroup, Form } from 'react-bootstrap';
import { useParams } from 'react-router-dom';

const BoardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Placeholder data for a single post
  const post = {
    id: id,
    title: `게시글 제목 ${id}`,
    author: 'User1',
    date: '2025-12-14',
    views: 10,
    content: `이것은 게시글 ${id}의 내용입니다. 여기에 상세한 내용이 들어갑니다.`,
    files: ['attachment1.pdf', 'image.jpg'],
    comments: [
      { id: 1, author: 'Commenter1', date: '2025-12-14', content: '첫 번째 댓글입니다.' },
      { id: 2, author: 'Commenter2', date: '2025-12-14', content: '두 번째 댓글입니다.' },
    ],
  };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header as="h5">{post.title}</Card.Header>
        <Card.Body>
          <Card.Subtitle className="mb-2 text-muted">
            작성자: {post.author} | 작성일: {post.date} | 조회수: {post.views}
          </Card.Subtitle>
          <Card.Text>{post.content}</Card.Text>

          {post.files && post.files.length > 0 && (
            <div className="mb-3">
              <h6>첨부파일:</h6>
              <ListGroup>
                {post.files.map((file, index) => (
                  <ListGroup.Item key={index}>
                    <a href="#">{file}</a>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}

          <div className="d-flex justify-content-end mb-3">
            <Button variant="secondary" className="me-2" href={`/board/edit/${post.id}`}>Edit</Button>
            <Button variant="danger">Delete</Button>
          </div>

          <hr />

          <h5 className="mb-3">Comments</h5>
          {post.comments && post.comments.length > 0 ? (
            <ListGroup className="mb-3">
              {post.comments.map((comment) => (
                <ListGroup.Item key={comment.id}>
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">{comment.author}</h6>
                    <small>{comment.date}</small>
                  </div>
                  <p className="mb-1">{comment.content}</p>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p>No comments yet.</p>
          )}

          <Form className="mb-3">
            <Form.Group className="mb-3" controlId="commentContent">
              <Form.Control as="textarea" rows={3} placeholder="댓글을 작성해주세요." />
            </Form.Group>
            <Button variant="primary" type="submit">
              댓글 작성
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BoardDetailPage;

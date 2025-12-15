import React from 'react';
import { Container, Form, Button, Card } from 'react-bootstrap';
import { useParams } from 'react-router-dom';

const BoardWritePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== undefined;

  return (
    <Container className="mt-4">
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">{isEditing ? '게시글 수정' : '게시글 작성'}</h2>
          <Form>
            <Form.Group className="mb-3" controlId="postTitle">
              <Form.Label>제목</Form.Label>
              <Form.Control type="text" placeholder="제목을 입력하세요" defaultValue={isEditing ? '기존 게시글 제목' : ''} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="postContent">
              <Form.Label>내용</Form.Label>
              <Form.Control as="textarea" rows={10} placeholder="내용을 입력하세요" defaultValue={isEditing ? '기존 게시글 내용' : ''} />
            </Form.Group>

            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>파일 첨부</Form.Label>
              <Form.Control type="file" multiple />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formSecret">
              <Form.Check type="checkbox" label="비밀글" />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit">
                {isEditing ? '수정 완료' : '작성 완료'}
              </Button>
              <Button variant="secondary" onClick={() => window.history.back()}>
                취소
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BoardWritePage;

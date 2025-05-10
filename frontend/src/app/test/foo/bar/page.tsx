interface TestPageProps {
  params: { foo: string; bar: string };
}

const TestPage = async ({ params }: TestPageProps) => {
  return <div>Test minimal TestPage: {params.foo}-{params.bar}</div>;
};

export default TestPage;

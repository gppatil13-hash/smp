# Contribution Guidelines

## Code Style

### TypeScript
- Use strict mode
- Type all function parameters and returns
- Use interfaces for object shapes
- Avoid `any` type

### Naming Conventions
- Classes: PascalCase
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case (except classes: PascalCase)

### Git Workflow

1. Create feature branch from `main`
   ```bash
   git checkout -b feature/descriptive-name
   ```

2. Make changes with meaningful commits
   ```bash
   git commit -m "feat: add student approval workflow"
   ```

3. Push to remote
   ```bash
   git push origin feature/descriptive-name
   ```

4. Create Pull Request with description

### Commit Messages

Format: `<type>: <description>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Dependencies, build changes

Example:
```
feat: implement fee payment reconciliation
fix: correct student fee balance calculation
docs: update API documentation
```

## Code Review Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.log statements in production code
- [ ] Error handling implemented
- [ ] TypeScript compilation without errors
- [ ] Backward compatibility maintained

## Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e
```

## Performance Guidelines

- ✅ Implement pagination for list endpoints
- ✅ Use database indexes strategically
- ✅ Avoid N+1 queries (use includes/relations)
- ✅ Compress responses (gzip)
- ✅ Cache frequently accessed data
- ✅ Optimize images and assets
- ✅ Monitor query performance

## Security Checklist

- ✅ Input validation on all endpoints
- ✅ SQL injection protection (use ORM)
- ✅ CSRF tokens where applicable
- ✅ XSS protection
- ✅ Proper error messages (no sensitive info)
- ✅ Rate limiting
- ✅ Secured API keys

---

**Version**: 1.0

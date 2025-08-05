# Bit.dev Component Migration Plan

## Objective
Migrate existing prebuilt ESM components to Bit.dev for better component management, versioning, and discovery while maintaining compatibility with the current ESM-first architecture and preparing for future Module Federation integration.

## Context
- **Created**: 2025-01-05
- **Status**: [ ] Not Started / [ ] In Progress / [ ] Completed
- **Complexity**: Medium

## Prerequisites
- [x] Bit.dev account and scope created (`zabaca.zabaca`)
- [ ] Understanding of current ESM component structure
- [ ] Node.js 16+ installed
- [ ] Git repository access
- [x] Component scope: `zabaca.zabaca`

## Relevant Resources
### Guides
- [Bit.dev Quick Start](https://bit.dev/docs/quick-start)
- [Creating React Components](https://bit.dev/docs/react-intro)
- Current ESM Architecture: `/docs/plans/poc/esm-first-plan.md`
- Module Federation Plan: `/docs/plans/bit-dev-fullstack-canvas-research/next/module-federation-migration-plan.md`

### Files
- `/public/components/*.js` - Current ESM components
- `/src/data/prebuiltComponents.ts` - Component library definitions
- `/src/services/ComponentPipeline.ts` - Component processing service
- `/src/components/ComponentLibrary.tsx` - Library browser UI

### Documentation
- [Bit.dev API Documentation](https://bit.dev/reference/apis/cli-server)
- [Bit Component Format](https://bit.dev/docs/components/component-format)
- [Publishing Components](https://bit.dev/docs/components/publishing-components)

## Goals

### Parent Goal 1: Set Up Bit.dev Workspace ✅
- [x] Sub-goal 1.1: Install Bit CLI globally
  ```bash
  npm install -g @teambit/bvm
  bvm install
  ```
- [x] Sub-goal 1.2: Initialize Bit workspace in project
  ```bash
  cd apps/ai-whiteboard-poc
  bit init --default-scope zabaca.zabaca
  ```
- [x] Sub-goal 1.3: Configure workspace for React components
  - ✅ Added React environment (`bitdev.react/react-env`)
  - ✅ Set up TypeScript configuration
  - ✅ Configure build pipeline
  - ✅ Updated default directory to `bit-components/{scope}/{name}`
- [x] Sub-goal 1.4: Set up `.gitignore` for Bit artifacts
  ```
  .bit/
  node_modules/.cache/
  .bitmap
  ```

### Parent Goal 2: Prepare Components for Migration
- [ ] Sub-goal 2.1: Audit existing components
  - List all components in `/public/components/`
  - Identify dependencies (e.g., canvas-confetti, lucide-react)
  - Document component interfaces
- [ ] Sub-goal 2.2: Create component metadata
  - Write descriptions for each component
  - Define component categories (UI, Animation, Icons, etc.)
  - Create usage examples
- [ ] Sub-goal 2.3: Standardize component structure
  ```javascript
  // Standard structure for Bit components
  export default ComponentName;
  export { ComponentName };
  ```
- [ ] Sub-goal 2.4: Add TypeScript definitions
  - Create `.d.ts` files for each component
  - Define prop interfaces

### Parent Goal 3: Migrate Components to Bit
- [ ] Sub-goal 3.1: Create Bit component structure
  ```
  bit-components/                  # Separate directory for published library components
  ├── ui/
  │   ├── confetti-button/
  │   │   ├── confetti-button.tsx
  │   │   ├── confetti-button.docs.mdx
  │   │   ├── confetti-button.spec.tsx
  │   │   └── index.ts
  │   └── ...
  └── icons/
      ├── lucide-demo/
      └── ...
  
  src/components/                  # App-specific components (not published to Bit)
  ├── ReactFlowCanvas.tsx
  ├── GeneratedApp.tsx
  └── ...
  ```
- [ ] Sub-goal 3.2: Convert ESM components to Bit format
  - Move from `.js` to `.tsx` with proper types
  - Update imports to use package names
  - Add component documentation
- [ ] Sub-goal 3.3: Create component tests
  - Basic render tests
  - Interaction tests where applicable
  - Visual regression tests (optional)
- [ ] Sub-goal 3.4: Add component examples
  ```typescript
  // confetti-button.composition.tsx
  export const BasicConfettiButton = () => (
    <ConfettiButton label="Click me!" />
  );
  ```

### Parent Goal 4: Update Import System
- [ ] Sub-goal 4.1: Create Bit component loader service
  ```typescript
  // services/BitComponentLoader.ts
  export class BitComponentLoader {
    async loadComponent(componentId: string) {
      const packageName = this.getPackageName(componentId);
      return import(packageName);
    }
  }
  ```
- [ ] Sub-goal 4.2: Integrate with ComponentPipeline
  - Add 'bit' as a new component source type
  - Update pipeline to handle Bit imports
  - Maintain backward compatibility
- [ ] Sub-goal 4.3: Update component discovery
  - Implement Bit API integration
  - Cache component metadata
  - Auto-generate component list
- [ ] Sub-goal 4.4: Update import maps
  ```javascript
  // Add Bit components to import map
  "imports": {
    "@bit/zabaca.zabaca.ui.confetti-button": 
      "https://node.bit.cloud/zabaca/zabaca/ui/confetti-button"
  }
  ```

### Parent Goal 5: Integrate Component Discovery
- [ ] Sub-goal 5.1: Create Bit API service
  ```typescript
  // services/BitDiscoveryService.ts
  export class BitDiscoveryService {
    async getAvailableComponents() {
      // Query Bit GraphQL API
    }
  }
  ```
- [ ] Sub-goal 5.2: Update ComponentLibrary UI
  - Add dynamic component loading from Bit
  - Show component metadata
  - Display version information
- [ ] Sub-goal 5.3: Implement component preview
  - Use Bit's preview URLs
  - Show live component demos
  - Include documentation
- [ ] Sub-goal 5.4: Add search and filtering
  - Search by name/description
  - Filter by category
  - Sort by popularity/date

### Parent Goal 6: Publish and Deploy
- [ ] Sub-goal 6.1: Tag components for release
  ```bash
  bit tag --all --message "Initial component release"
  ```
- [ ] Sub-goal 6.2: Export to Bit.cloud
  ```bash
  bit export
  ```
- [ ] Sub-goal 6.3: Verify published components
  - Check component pages on Bit.cloud
  - Test CDN URLs
  - Verify package installations
- [ ] Sub-goal 6.4: Update documentation
  - Add Bit component usage guide
  - Update README with new workflow
  - Document API integration

### Parent Goal 7: Maintain Backward Compatibility
- [ ] Sub-goal 7.1: Keep existing component URLs working
  - Maintain `/public/components/` during transition
  - Add deprecation notices
  - Plan sunset timeline
- [ ] Sub-goal 7.2: Support both import methods
  ```typescript
  // Support both during transition
  import Button from '/components/button.js'; // Old
  import Button from '@bit/zabaca.zabaca.ui.confetti-button'; // New
  ```
- [ ] Sub-goal 7.3: Migrate existing canvas saves
  - Update stored component references
  - Handle version differences
  - Provide migration tool

## Implementation Notes

### Component Naming Convention
```
zabaca.zabaca/{category}/{component-name}
Examples:
- zabaca.zabaca/ui/confetti-button
- zabaca.zabaca/icons/lucide-demo
- zabaca.zabaca/charts/bar-chart
```

### Bit Component Structure
```
confetti-button/
├── confetti-button.tsx        # Main component
├── confetti-button.module.css # Styles (if needed)
├── confetti-button.spec.tsx   # Tests
├── confetti-button.docs.mdx   # Documentation
├── confetti-button.composition.tsx # Live examples
└── index.ts                   # Exports
```

### Integration with Module Federation
Components published to Bit will be ready for Module Federation:
```javascript
// Future Module Federation config
exposes: {
  './ConfettiButton': '@bit/zabaca.zabaca.ui.confetti-button'
}
```

## Testing Strategy

### Component Testing
- Unit tests for each component with React Testing Library
- Visual tests using Bit's preview system
- Integration tests with the canvas application

### System Testing
- Verify component loading in development
- Test production CDN URLs
- Validate API responses
- Check performance metrics

### Migration Testing
- Test parallel operation (old + new)
- Verify backward compatibility
- Load test with many components
- Test offline scenarios

## Risks & Mitigations

### Risk 1: Breaking Existing Functionality
**Mitigation**: 
- Maintain parallel systems during transition
- Extensive testing before switching
- Gradual rollout with feature flags

### Risk 2: Performance Degradation
**Mitigation**:
- Cache component metadata aggressively
- Use CDN for component delivery
- Maintain local fallbacks

### Risk 3: API Rate Limits
**Mitigation**:
- Implement request caching
- Use batch queries where possible
- Add retry logic with backoff

### Risk 4: Component Version Conflicts
**Mitigation**:
- Clear versioning strategy
- Dependency resolution rules
- Version pinning options

## Timeline Estimate
- Planning: 2 days
- Workspace Setup: 1 day
- Component Preparation: 3 days
- Migration: 5 days
- Integration: 3 days
- Testing: 2 days
- Documentation: 1 day
- **Total**: ~17 days (3-4 weeks with buffer)

## Success Criteria
- [ ] All prebuilt components migrated to Bit
- [ ] Component discovery API integrated
- [ ] No regression in existing functionality
- [ ] Improved component management workflow
- [ ] Documentation complete
- [ ] Team trained on new workflow

## Future Enhancements
1. **Automated Publishing**: CI/CD pipeline for component updates
2. **Component Analytics**: Track usage and popularity
3. **Version Management UI**: In-app version switching
4. **Component Playground**: Edit and test components live
5. **Collaborative Features**: Share and fork components

## Discussion

### Questions for Team
1. ~~What should our Bit organization/scope name be?~~ **Decided: zabaca.zabaca**
2. Should we migrate all components at once or gradually?
3. Do we need visual regression testing for components?
4. How should we handle component versioning?
5. Should we support private components?

### Decisions Made
- Use ESM format for all Bit components
- Maintain import maps compatibility
- Keep components framework-agnostic where possible
- Prioritize developer experience

### Notes
- Bit.dev free tier allows unlimited public components
- Consider enterprise plan for private components
- Module Federation migration will be easier with Bit components
- Component marketplace could become a product feature

## Relevant Files

### Created Files
- `workspace.jsonc` - Bit workspace configuration with React environment and custom directory structure
- `bit-components/` - Directory structure for published library components
  - `bit-components/ui/` - UI components directory
  - `bit-components/icons/` - Icons components directory

### Modified Files  
- `.gitignore` - Added Bit artifacts (.bit/, node_modules/.cache/, .bitmap)
- `workspace.jsonc` - Configured React environment and set defaultDirectory to bit-components/{scope}/{name}